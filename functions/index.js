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
    // Parse: 8-Epping-Dr-Bella-Vista-AR-72714
    const slug = match[1];
    // Remove zpid suffix if present
    const clean = slug.replace(/-\d+_zpid$/, "").replace(/_zpid$/, "");
    return clean
      .replace(/-(\d{5})$/, ", $1")       // ZIP
      .replace(/-([A-Z]{2})-/, ", $1 ")   // State
      .replace(/-/g, " ")
      .trim();
  } catch { return ""; }
}

function extractZpid(url) {
  try {
    const match = url.match(/\/(\d+)_zpid/);
    return match ? match[1] : null;
  } catch { return null; }
}

async function searchByAddress(address) {
  console.log("Searching by address:", address);
  const encodedAddress = encodeURIComponent(address);
  const apiUrl = `https://${RAPIDAPI_HOST}/api/zillow/search/byaddress?location=${encodedAddress}&listingStatus=For_Sale&homeType=houses&page=1&sortOrder=Homes_for_you`;

  const response = await fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
  });

  console.log("Search response status:", response.status);
  if (!response.ok) throw new Error(`RapidAPI returned ${response.status}`);

  const json = await response.json();
  console.log("Search result keys:", Object.keys(json).join(", "));

  // Find the best matching property
  const listings = json?.searchResults?.listResults || json?.results || json?.data || [];
  console.log("Listings found:", listings.length);

  if (!listings.length) {
    // Try without filters for sold/off-market homes
    return searchByAddressAny(address);
  }

  const prop = listings[0];
  return formatProperty(prop);
}

async function searchByAddressAny(address) {
  console.log("Retrying search without filters:", address);
  const encodedAddress = encodeURIComponent(address);
  const apiUrl = `https://${RAPIDAPI_HOST}/api/zillow/search/byaddress?location=${encodedAddress}&page=1`;

  const response = await fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
  });

  if (!response.ok) throw new Error(`RapidAPI search retry returned ${response.status}`);
  const json = await response.json();
  const listings = json?.searchResults?.listResults || json?.results || json?.data || [];
  console.log("Retry listings found:", listings.length);
  if (!listings.length) throw new Error("No listings found for this address");
  return formatProperty(listings[0]);
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
