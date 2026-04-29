const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({ maxInstances: 10 });

const RAPIDAPI_KEY = "697dd9b3c6msh463d183612ebbf7p1eb708jsn558cc5817d68";
const RAPIDAPI_HOST = "zillow56.p.rapidapi.com";

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

    const zpid = extractZpid(url);
    const addressFromUrl = extractAddressFromUrl(url);
    console.log("ZPID:", zpid);
    console.log("Address from URL:", addressFromUrl);

    try {
      if (!zpid) throw new Error("Could not extract ZPID from URL");

      const data = await getPropertyByZpid(zpid, addressFromUrl);
      console.log("=== SUCCESS ===", data.address);
      res.json(data);
    } catch (err) {
      console.error("=== FAILED ===", err.message);
      res.json({ error: err.message, address: addressFromUrl, _partial: true });
    }
  }
);

function extractZpid(url) {
  try {
    const match = url.match(/\/(\d+)_zpid/);
    return match ? match[1] : null;
  } catch { return null; }
}

function extractAddressFromUrl(url) {
  try {
    const match = url.match(/homedetails\/([^/]+)\//);
    if (!match) return "";
    const clean = match[1].replace(/-\d{6,}_zpid.*$/, "").replace(/_zpid.*$/, "");
    const zipMatch = clean.match(/-(\d{5})$/);
    const zip = zipMatch ? zipMatch[1] : "";
    const withoutZip = zip ? clean.replace(/-\d{5}$/, "") : clean;
    const stateMatch = withoutZip.match(/-([A-Z]{2})$/);
    const state = stateMatch ? stateMatch[1] : "";
    const withoutState = state ? withoutZip.replace(/-[A-Z]{2}$/, "") : withoutZip;
    const streetAndCity = withoutState.replace(/-/g, " ");
    return [streetAndCity, state, zip].filter(Boolean).join(" ");
  } catch { return ""; }
}

async function getPropertyByZpid(zpid, fallbackAddress) {
  console.log("Fetching property details for zpid:", zpid);

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/propertyDetails?zpid=${zpid}`,
    {
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    }
  );

  console.log("Response status:", response.status);
  if (!response.ok) {
    const body = await response.text();
    console.log("Error body:", body.substring(0, 200));
    throw new Error(`RapidAPI zillow56 returned ${response.status}: ${body.substring(0, 100)}`);
  }

  const json = await response.json();
  console.log("Response keys:", Object.keys(json).slice(0, 15).join(", "));

  return formatProperty(json, fallbackAddress);
}

function formatProperty(prop, fallbackAddress) {
  if (!prop) throw new Error("Empty property response");

  const imageUrls = extractImages(prop);

  // Price - zillow56 returns price as number
  let price = "";
  if (prop.price) price = `$${Number(prop.price).toLocaleString()}`;
  else if (prop.listPrice) price = `$${Number(prop.listPrice).toLocaleString()}`;
  else if (prop.zestimate) price = `$${Number(prop.zestimate).toLocaleString()} (Zestimate)`;

  // Address
  const street = prop.streetAddress || prop.address || "";
  const city = prop.city || "";
  const state = prop.state || "";
  const zip = prop.zipcode || prop.zip || "";
  const fullAddress = [street, city, state, zip].filter(Boolean).join(", ") || fallbackAddress;

  // Lot size
  const lotVal = prop.lotAreaValue || prop.lotSize || "";
  const lotUnit = prop.lotAreaUnit || "sqft";
  const lotSize = lotVal ? `${lotVal} ${lotUnit}` : "";

  return {
    address: fullAddress,
    price,
    beds: (prop.bedrooms || prop.beds || "").toString(),
    baths: (prop.bathrooms || prop.baths || "").toString(),
    sqft: prop.livingArea
      ? Number(prop.livingArea).toLocaleString()
      : (prop.livingAreaValue?.toString() || ""),
    lotSize,
    yearBuilt: (prop.yearBuilt || "").toString(),
    propertyType: (prop.propertyTypeDimension || prop.homeType || prop.propertyType || "")
      .replace(/_/g, " ")
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
    description: prop.description || "",
    imageUrls,
  };
}

function extractImages(prop) {
  const images = [];
  for (const photos of [
    prop.carouselPhotos,
    prop.originalPhotos,
    prop.responsivePhotos,
    prop.photos,
    prop.bigPhotos,
  ]) {
    if (!Array.isArray(photos)) continue;
    for (const p of photos) {
      const u = typeof p === "string" ? p
        : p?.url || p?.src || p?.imgSrc
        || p?.mixedSources?.jpeg?.[0]?.url
        || p?.mixedSources?.webp?.[0]?.url
        || null;
      if (u && !images.includes(u)) images.push(u);
    }
    if (images.length >= 5) break;
  }
  if (prop.imgSrc && !images.includes(prop.imgSrc)) images.unshift(prop.imgSrc);
  return images.slice(0, 30);
}
