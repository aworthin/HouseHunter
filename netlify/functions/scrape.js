// netlify/functions/scrape.js
// Uses private-zillow RapidAPI - bypasses Zillow IP blocking

const RAPIDAPI_KEY = "697dd9b3c6msh463d183612ebbf7p1eb708jsn558cc5817d68";
const RAPIDAPI_HOST = "private-zillow.p.rapidapi.com";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders() };
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let url;
  try {
    url = JSON.parse(event.body).url;
    if (!url) throw new Error("No URL");
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // Strip UTM tracking params added by iOS share sheet
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

    const [propData, imgData] = await Promise.all([
      getPropertyDetails(zpid),
      getPropertyImages(zpid, url),
    ]);

    const propDetails = propData?.propertyDetails || propData;
    const result = formatProperty(propDetails, imgData, addressFromUrl);
    console.log("=== SUCCESS === address:", result.address, "images:", result.imageUrls.length);
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("=== FAILED ===", err.message);
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message, address: addressFromUrl, _partial: true }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

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
    return [withoutState.replace(/-/g, " "), state, zip].filter(Boolean).join(" ");
  } catch { return ""; }
}

async function getPropertyDetails(zpid) {
  console.log("Fetching property details, zpid:", zpid);
  const response = await fetch(
    `https://${RAPIDAPI_HOST}/pro/byzpid?zpid=${zpid}`,
    {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    }
  );
  console.log("Details status:", response.status);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RapidAPI returned ${response.status}: ${text.substring(0, 100)}`);
  }
  const json = await response.json();
  const details = json?.propertyDetails || json;
  console.log("propertyDetails keys:", Object.keys(details).slice(0, 20).join(", "));
  console.log("price:", details.price, "beds:", details.bedrooms, "baths:", details.bathrooms, "sqft:", details.livingArea);
  return json;
}

async function getPropertyImages(zpid, url) {
  console.log("Fetching images, zpid:", zpid);
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/propimages?byzpid=${zpid}&byurl=${encodedUrl}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      }
    );
    console.log("Images status:", response.status);
    if (!response.ok) return {};
    const json = await response.json();
    console.log("Images keys:", Object.keys(json).slice(0, 8).join(", "));
    return json;
  } catch (e) {
    console.log("Images fetch failed:", e.message);
    return {};
  }
}

function formatLotSize(prop) {
  const val = prop.lotAreaValue || prop.lotSize;
  if (!val) return "";
  const num = parseFloat(val);
  if (!num || num <= 0) return "";  // hide zero/null values
  const unit = prop.lotAreaUnit || "sqft";
  if (unit === "sqft" || unit === "squareFeet") {
    if (num > 1000) return `${(num / 43560).toFixed(2)} acres`;
    return `${Math.round(num)} sqft`;
  }
  return `${num.toFixed(2)} ${unit}`;
}

function formatProperty(prop, imgData, fallbackAddress) {
  if (!prop) throw new Error("Empty property response");

  const imageUrls = extractImages(prop, imgData);

  let price = "";
  if (prop.price) price = `$${Number(prop.price).toLocaleString()}`;
  else if (prop.listPrice) price = `$${Number(prop.listPrice).toLocaleString()}`;
  else if (prop.zestimate) price = `$${Number(prop.zestimate).toLocaleString()} (Zestimate)`;

  const street = prop.streetAddress || prop.address || "";
  const city = prop.city || "";
  const state = prop.state || "";
  const zip = prop.zipcode || prop.zip || "";
  const fullAddress = [street, city, state, zip].filter(Boolean).join(", ") || fallbackAddress;

  return {
    address: fullAddress,
    price,
    beds: (prop.bedrooms || prop.beds || "").toString(),
    baths: (prop.bathrooms || prop.baths || "").toString(),
    sqft: prop.livingArea ? Number(prop.livingArea).toLocaleString() : (prop.livingAreaValue?.toString() || ""),
    lotSize: formatLotSize(prop),
    yearBuilt: (prop.yearBuilt || "").toString(),
    propertyType: (prop.propertyTypeDimension || prop.homeType || prop.propertyType || "")
      .replace(/_/g, " ")
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
    description: prop.description || "",
    imageUrls,
  };
}

function extractImages(prop, imgData) {
  const images = [];

  // private-zillow returns hiResImageLink directly
  if (imgData?.hiResImageLink) images.push(imgData.hiResImageLink);

  const imgSources = Array.isArray(imgData)
    ? imgData
    : (imgData?.images || imgData?.photos || imgData?.carouselPhotos || imgData?.propertyImages || []);
  for (const p of imgSources) {
    const u = typeof p === "string" ? p : p?.url || p?.src || p?.imgSrc || null;
    if (u && !images.includes(u)) images.push(u);
  }

  // Also try property data
  for (const photos of [prop.carouselPhotos, prop.originalPhotos, prop.responsivePhotos, prop.photos, prop.bigPhotos]) {
    if (!Array.isArray(photos)) continue;
    for (const p of photos) {
      const u = typeof p === "string" ? p
        : p?.url || p?.src || p?.imgSrc
        || p?.mixedSources?.jpeg?.[0]?.url
        || p?.mixedSources?.webp?.[0]?.url || null;
      if (u && !images.includes(u)) images.push(u);
    }
    if (images.length >= 10) break;
  }

  if (prop.imgSrc && !images.includes(prop.imgSrc)) images.unshift(prop.imgSrc);
  return images.slice(0, 30);
}
