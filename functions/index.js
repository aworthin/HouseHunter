const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

setGlobalOptions({ maxInstances: 10 });

exports.scrape = onRequest(
  { 
    cors: ["https://bw-house-hunter.netlify.app", "http://localhost:5173", "*"],
    timeoutSeconds: 30 
  },
  async (req, res) => {
    // Explicitly set CORS headers on every response
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    let url = req.body?.url;
    if (!url || !url.includes("zillow.com")) {
      res.status(400).json({ error: "Valid Zillow URL required" });
      return;
    }

    console.log("=== SCRAPE START ===");
    console.log("Raw URL:", url);

    // Strip UTM tracking params added by iOS share sheet / Zillow app
    try {
      const parsed = new URL(url);
      url = `https://www.zillow.com${parsed.pathname}`;
      if (!url.endsWith("/")) url += "/";
    } catch (e) {
      console.log("URL parse failed, using as-is:", e.message);
    }
    console.log("Cleaned URL:", url);

    const addressFromUrl = extractAddressFromUrl(url);
    console.log("Address from URL:", addressFromUrl);

    try {
      const data = await scrapeZillow(url);
      console.log("=== SCRAPE SUCCESS ===");
      console.log("Address:", data.address);
      console.log("Images:", data.imageUrls?.length);
      res.json(data);
    } catch (err) {
      console.error("=== SCRAPE FAILED ===");
      console.error("Error:", err.message);
      res.json({
        error: err.message,
        address: addressFromUrl,
        _partial: true,
      });
    }
  }
);

function extractAddressFromUrl(url) {
  try {
    const match = url.match(/homedetails\/([^/]+)\//);
    if (!match) return "";
    return match[1]
      .replace(/-(\d{5})(-\d+)?$/, ", $1")
      .replace(/-([A-Z]{2})-/, ", $1 ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

async function scrapeZillow(url) {
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  ];

  let lastError = null;

  for (const ua of userAgents) {
    try {
      console.log("Trying UA:", ua.substring(0, 60));
      const response = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      });

      console.log("HTTP status:", response.status);

      if (response.status === 403) { lastError = "Zillow returned 403 Forbidden (IP blocked)"; continue; }
      if (response.status === 429) { lastError = "Zillow returned 429 Too Many Requests"; continue; }
      if (response.status !== 200) { lastError = `Zillow returned HTTP ${response.status}`; continue; }

      const html = await response.text();
      console.log("HTML length:", html.length);
      console.log("Has __NEXT_DATA__:", html.includes("__NEXT_DATA__"));
      console.log("Has captcha:", html.includes("captcha"));

      if (html.length < 5000) { lastError = `Page too short (${html.length} chars)`; continue; }
      if (html.includes("captcha") || html.includes("cf-challenge")) { lastError = "Bot detection page"; continue; }
      if (!html.includes("__NEXT_DATA__")) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        console.log("Page title:", titleMatch?.[1] || "no title");
        lastError = "No __NEXT_DATA__ found";
        continue;
      }

      return parseZillowHtml(html);
    } catch (err) {
      console.error("Fetch error:", err.message);
      lastError = err.message;
    }
  }

  throw new Error(lastError || "All fetch attempts failed");
}

function parseZillowHtml(html) {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nextDataMatch) throw new Error("Could not extract __NEXT_DATA__");

  const nextData = JSON.parse(nextDataMatch[1]);
  const props = nextData?.props?.pageProps;
  console.log("pageProps keys:", Object.keys(props || {}).join(", "));

  let property = null;

  const gdpClientCache = props?.componentProps?.gdpClientCache;
  if (gdpClientCache) {
    try {
      const cacheData = JSON.parse(gdpClientCache);
      for (const key of Object.keys(cacheData)) {
        if (cacheData[key]?.property) { property = cacheData[key].property; console.log("Found via gdpClientCache"); break; }
      }
    } catch (e) { console.log("gdpClientCache failed:", e.message); }
  }

  if (!property) { property = props?.initialReduxState?.gdp?.propertyData; if (property) console.log("Found via initialReduxState"); }
  if (!property) { property = props?.property || props?.homeDetails || props?.listingData; if (property) console.log("Found via direct props"); }

  if (!property) {
    console.error("Property not found. pageProps sample:", JSON.stringify(props).substring(0, 500));
    throw new Error("Property data not found in Zillow page");
  }

  const imageUrls = extractImages(property);
  const price = property.price
    ? `$${Number(property.price).toLocaleString()}`
    : property.zestimate ? `$${Number(property.zestimate).toLocaleString()} (Zestimate)` : "";

  return {
    address: [property.streetAddress, property.city, property.state, property.zipcode].filter(Boolean).join(", "),
    price,
    beds: property.bedrooms?.toString() || "",
    baths: property.bathrooms?.toString() || "",
    sqft: property.livingArea ? Number(property.livingArea).toLocaleString() : "",
    lotSize: property.lotAreaValue ? `${property.lotAreaValue} ${property.lotAreaUnit || "sqft"}` : "",
    yearBuilt: property.yearBuilt?.toString() || "",
    propertyType: (property.propertyTypeDimension || property.homeType || "")
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
    description: property.description || "",
    imageUrls,
  };
}

function extractImages(property) {
  const images = [];
  if (property.hiResImageLink) images.push(property.hiResImageLink);
  for (const photos of [property.originalPhotos, property.photos, property.responsivePhotos, property.hugePhotos]) {
    if (!Array.isArray(photos)) continue;
    for (const photo of photos) {
      const url = typeof photo === "string" ? photo
        : photo?.url || photo?.mixedSources?.jpeg?.[0]?.url || photo?.mixedSources?.webp?.[0]?.url || photo?.src || null;
      if (url && !images.includes(url)) images.push(url);
    }
    if (images.length >= 5) break;
  }
  return images.slice(0, 30);
}
