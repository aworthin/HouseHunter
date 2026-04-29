const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({ maxInstances: 10 });

const RAPIDAPI_KEY = "697dd9b3c6msh463d183612ebbf7p1eb708jsn558cc5817d68";
const RAPIDAPI_HOST = "zillow-property-data-api1.p.rapidapi.com";

exports.scrape = onRequest(
  { timeoutSeconds: 30 },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return; }

    let url = req.body?.url;
    if (!url || !url.includes("zillow.com")) {
      res.status(400).json({ error: "Valid Zillow URL required" });
      return;
    }

    // Strip UTM tracking params
    try {
      const parsed = new URL(url);
      url = `https://www.zillow.com${parsed.pathname}`;
      if (!url.endsWith("/")) url += "/";
    } catch (e) { console.log("URL parse failed:", e.message); }

    console.log("=== SCRAPE START ===");
    console.log("Cleaned URL:", url);

    // Extract address from URL as primary lookup key
    const addressFromUrl = extractAddressFromUrl(url);
    const zpid = extractZpid(url);
    console.log("Address from URL:", addressFromUrl);
    console.log("ZPID from URL:", zpid);

    try {
      let data = null;

      // Strategy 1: Search by address (most reliable)
      if (addressFromUrl) {
        data = await searchByAddress(addressFromUrl);
      }

      // Strategy 2: If address search fails, try property images + tax info by zpid
      if (!data && zpid) {
        data = await getByZpid(zpid, addressFromUrl);
      }

      if (!data) throw new Error("Could not find property data");

      console.log("=== SUCCESS ===", data.address);
      res.json(data);
    } catch (err) {
      console.error("=== FAILED ===", err.message);
      res.json({ error: err.message, address: addressFromUrl, _partial: true });
    }
  }
);

function extractAddressFromUrl(url) {
  try {
    const match = url.match(/homedetails\/([^/]+)\//);
    if (!match) return "";
    const slug = match[1];
    // Remove zpid suffix: 8-Epping-Dr-Bella-Vista-AR-72714-454348587_zpid
    const clean = slug.replace(/-\d{7,}_zpid.*$/, "").replace(/_zpid.*$/, "");
    // clean = "8-Epping-Dr-Bella-Vista-AR-72714"
    // Find ZIP (5 digits at end)
    const zipMatch = clean.match(/-(\d{5})$/);
    const zip = zipMatch ? zipMatch[1] : "";
    const withoutZip = zip ? clean.replace(/-\d{5}$/, "") : clean;
    // Find state (2 uppercase letters before ZIP)
    const stateMatch = withoutZip.match(/-([A-Z]{2})$/);
    const state = stateMatch ? stateMatch[1] : "";
    const withoutState = state ? withoutZip.replace(/-[A-Z]{2}$/, "") : withoutZip;
    // Remaining is street + city - hard to split so use full string for city
    // Convert dashes to spaces
    const streetAndCity = withoutState.replace(/-/g, " ");
    // Try to find where street ends and city begins (after street number + 1-2 words)
    const parts = streetAndCity.split(" ");
    // Street is typically: number + 1-3 words. City is the rest.
    // Use full address for the search - most accurate
    const fullAddress = [streetAndCity, state, zip].filter(Boolean).join(" ");
    console.log("Parsed address parts - street+city:", streetAndCity, "state:", state, "zip:", zip);
    return fullAddress;
  } catch (e) {
    console.log("Address parse error:", e.message);
    return "";
  }
}

function extractZpid(url) {
  try {
    const match = url.match(/\/(\d+)_zpid/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function searchByAddress(address) {
  // Try multiple search strategies
  const strategies = [
    // 1. Full address no filters
    `https://${RAPIDAPI_HOST}/api/zillow/search/byaddress?location=${encodeURIComponent(address)}&page=1`,
    // 2. Just street + city (drop state/zip)
    `https://${RAPIDAPI_HOST}/api/zillow/search/byaddress?location=${encodeURIComponent(address.split(" ").slice(0, 4).join(" "))}&page=1`,
    // 3. With For Sale filter
    `https://${RAPIDAPI_HOST}/api/zillow/search/byaddress?location=${encodeURIComponent(address)}&listingStatus=For_Sale&page=1`,
  ];

  for (const apiUrl of strategies) {
    console.log("Trying search URL:", apiUrl);
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      });

      console.log("Search response status:", response.status);
      if (!response.ok) continue;

      const json = await response.json();
      console.log("Search result keys:", Object.keys(json).join(", "));
      console.log("resultsCount:", json.resultsCount);

      const listings = json?.searchResults?.listResults || json?.results || json?.data || [];
      console.log("Listings found:", listings.length);

      if (listings.length > 0) {
        return formatProperty(listings[0]);
      }
    } catch (e) {
      console.log("Strategy failed:", e.message);
    }
  }

  throw new Error("No listings found for address: " + address);
}

async function getByZpid(zpid, fallbackAddress) {
  console.log("Getting images by zpid:", zpid);
  try {
    const imgResponse = await fetch(
      `https://${RAPIDAPI_HOST}/api/zillow/property/images?byzpid=${zpid}`,
      {
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      }
    );
    const imgData = imgResponse.ok ? await imgResponse.json() : {};
    const imageUrls = extractImagesFromResponse(imgData);
    return {
      address: fallbackAddress,
      imageUrls,
      price: "", beds: "", baths: "", sqft: "",
      lotSize: "", yearBuilt: "", propertyType: "", description: "",
    };
  } catch (e) {
    console.log("ZPID fetch failed:", e.message);
    return null;
  }
}

function formatProperty(prop) {
  if (!prop) return null;
  console.log("Property keys:", Object.keys(prop).slice(0, 15).join(", "));

  // Extract images from various possible locations
  const imageUrls = extractImagesFromProperty(prop);

  // Price
  let price = "";
  if (prop.price?.value) price = `$${Number(prop.price.value).toLocaleString()}`;
  else if (prop.unformattedPrice) price = `$${Number(prop.unformattedPrice).toLocaleString()}`;
  else if (prop.price && typeof prop.price === "number") price = `$${Number(prop.price).toLocaleString()}`;
  else if (prop.listPrice) price = `$${Number(prop.listPrice).toLocaleString()}`;

  // Address
  const addr = prop.address || prop.streetAddress || "";
  const city = prop.city || "";
  const state = prop.state || "";
  const zip = prop.zipcode || prop.zip || "";
  const fullAddress = [addr, city, state, zip].filter(Boolean).join(", ") || prop.hdpData?.homeInfo?.streetAddress || "";

  // Lot size
  const lotVal = prop.lotSizeWithUnit?.lotSize || prop.lotAreaValue || prop.lotSize || "";
  const lotUnit = prop.lotSizeWithUnit?.lotSizeUnit || prop.lotAreaUnit || "sqft";
  const lotSize = lotVal ? `${lotVal} ${lotUnit}` : "";

  return {
    address: fullAddress,
    price,
    beds: (prop.bedrooms || prop.beds || "").toString(),
    baths: (prop.bathrooms || prop.baths || "").toString(),
    sqft: prop.livingArea ? Number(prop.livingArea).toLocaleString() : (prop.area?.toString() || ""),
    lotSize,
    yearBuilt: (prop.yearBuilt || "").toString(),
    propertyType: (prop.propertyType || prop.homeType || "")
      .replace(/_/g, " ")
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
    description: prop.description || prop.listing?.description || "",
    imageUrls,
  };
}

function extractImagesFromProperty(prop) {
  const images = [];
  // Various image paths the API might return
  for (const photos of [
    prop.carouselPhotos, prop.photos, prop.images,
    prop.hdpData?.homeInfo?.carouselPhotos,
  ]) {
    if (!Array.isArray(photos)) continue;
    for (const p of photos) {
      const u = typeof p === "string" ? p : p?.url || p?.src || p?.imgSrc || null;
      if (u && !images.includes(u)) images.push(u);
    }
    if (images.length >= 5) break;
  }
  if (prop.imgSrc && !images.includes(prop.imgSrc)) images.unshift(prop.imgSrc);
  return images.slice(0, 30);
}

function extractImagesFromResponse(data) {
  const images = [];
  const photos = data?.images || data?.photos || data?.carouselPhotos || [];
  for (const p of photos) {
    const u = typeof p === "string" ? p : p?.url || p?.src || null;
    if (u && !images.includes(u)) images.push(u);
  }
  return images.slice(0, 30);
}
