// netlify/functions/scrape.js
// Uses Private-Zillow RapidAPI (/pro/byzpid endpoint)
// Single API call returns all property data including images
//
// FULL API RESPONSE STRUCTURE (documented for future field additions):
// propertyDetails: {
//   zpid, price, zestimate, rentZestimate
//   streetAddress, city, state, zipcode, county
//   bedrooms, bathrooms, livingArea, livingAreaValue
//   lotAreaValue, lotAreaUnits, lotSize (sqft numeric)
//   yearBuilt, homeType, propertyTypeDimension
//   description, homeStatus, timeOnZillow, daysOnZillow
//   latitude, longitude, photoCount
//   hiResImageLink (single hero image URL)
//   originalPhotos[]: { caption, mixedSources: { jpeg[]: {url, width}, webp[]: {url, width} } }
//   attributionInfo: { agentName, agentEmail, agentPhoneNumber, brokerName, mlsId, mlsName }
//   schools[]: { name, rating, grades, distance, link }
//   priceHistory[]: { date, price, event, source }
//   taxHistory[]
//   listingSubType: { isFSBA, isFSBO, isPending, isNewHome, isForeclosure, ... }
//   monthlyHoaFee
//   thirdPartyVirtualTour: { externalUrl } (3D tour link)
//   resoFacts: {  <-- 187 keys of MLS data, most useful ones:
//     bathrooms, bathroomsFull, bathroomsHalf
//     bedrooms, homeType, lotSize (formatted string e.g. "0.33 Acres")
//     yearBuilt, pricePerSquareFoot
//     propertySubType[], stories, livingArea (formatted string)
//     hasGarage, hasAttachedGarage, garageParkingCapacity, parkingCapacity
//     heating[], cooling[], appliances[], flooring[]
//     interiorFeatures[], exteriorFeatures[]
//     communityFeatures[], poolFeatures[]
//     constructionMaterials[], roofType, foundationDetails[]
//     hoaFee, associations[]: { name, feeFrequency }
//     elementarySchool, middleOrJuniorSchool, highSchool, highSchoolDistrict
//     isNewConstruction, builderName, builderModel
//     atAGlanceFacts[]: { factLabel, factValue } (pre-formatted summary facts)
//     basement, sewer[], waterSource[], utilities[]
//     taxAnnualAmount, parcelNumber
//     cumulativeDaysOnMarket, onMarketDate
//     virtualTour (URL)
//   }
//   collections.modules[0].propertyDetails[] (similar homes nearby)
//   nearbyHomes[] (nearby properties)
// }

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
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

  // Strip UTM tracking params added by iOS share sheet / Zillow app
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

  if (!zpid) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not extract ZPID from URL", address: addressFromUrl, _partial: true }),
    };
  }

  try {
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

    console.log("API status:", response.status);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RapidAPI returned ${response.status}: ${text.substring(0, 100)}`);
    }

    const json = await response.json();
    const prop = json?.propertyDetails || json;

    console.log("Got property:", prop.streetAddress, prop.city);
    console.log("Photos available:", prop.originalPhotos?.length || 0);

    const result = formatProperty(prop, addressFromUrl);
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

function formatProperty(prop, fallbackAddress) {
  if (!prop) throw new Error("Empty property response");

  const reso = prop.resoFacts || {};

  // ── Off-market / sold detection ──────────────────────────────────
  const homeStatus = prop.homeStatus || "";
  const isSold = ["RECENTLY_SOLD", "SOLD"].includes(homeStatus);

  // Off market if: status is OTHER/UNKNOWN, OR no beds+baths, OR "Claim home" page (no MLS data)
  const isOffMarket = !isSold && (
    homeStatus === "OTHER" ||
    homeStatus === "HOME_TYPE_UNKNOWN" ||
    homeStatus === "" ||
    (prop.bedrooms === null && prop.bathrooms === null) ||
    (!prop.livingAreaValue && !prop.bedrooms && homeStatus !== "FOR_SALE" && homeStatus !== "PENDING")
  );

  const address = formatAddress(prop, fallbackAddress);

  // ── Debug logging for market status ───────────────────────────
  console.log("=== MARKET STATUS CHECK ===");
  console.log("homeStatus:", homeStatus);
  console.log("bedrooms:", prop.bedrooms);
  console.log("bathrooms:", prop.bathrooms);
  console.log("livingAreaValue:", prop.livingAreaValue);
  console.log("mlsId:", prop.attributionInfo?.mlsId);
  console.log("isSold:", isSold);
  console.log("isOffMarket:", isOffMarket);
  console.log("===========================");

  if (isSold) {
    console.log("RESULT: sold");
    return { _sold: true, homeStatus, address };
  }
  if (isOffMarket) {
    console.log("RESULT: off-market");
    return { _offMarket: true, homeStatus, address };
  }
  console.log("RESULT: active listing");

  // ── Address ────────────────────────────────────────────────────
  const fullAddress = formatAddress(prop, fallbackAddress);

  // ── Price ──────────────────────────────────────────────────────
  let price = "";
  if (prop.price) price = `$${Number(prop.price).toLocaleString()}`;
  else if (prop.zestimate) price = `$${Number(prop.zestimate).toLocaleString()} (Zestimate)`;

  // ── Lot size ───────────────────────────────────────────────────
  let lotSize = reso.lotSize || "";
  if (!lotSize && prop.lotAreaValue) {
    const val = parseFloat(prop.lotAreaValue);
    if (val > 0) {
      const unit = prop.lotAreaUnits || "Acres";
      lotSize = unit.toLowerCase().includes("acre")
        ? `${val.toFixed(2)} Acres`
        : val > 1000 ? `${(val / 43560).toFixed(2)} Acres` : `${Math.round(val)} sqft`;
    }
  }

  // ── Garage / parking ───────────────────────────────────────────
  let garage = "";
  if (reso.hasGarage || reso.hasAttachedGarage) {
    const spaces = reso.garageParkingCapacity || reso.coveredParkingCapacity || reso.parkingCapacity || "";
    const type = reso.hasAttachedGarage ? "Attached" : "Garage";
    garage = spaces ? `${spaces}-car ${type} Garage` : `${type} Garage`;
    if (reso.parkingFeatures?.length) {
      const extra = reso.parkingFeatures.filter(f => !["Attached","Garage","Garage Door Opener"].includes(f));
      if (extra.length) garage += ` (${extra.join(", ")})`;
    }
  } else if (reso.parkingCapacity) {
    garage = `${reso.parkingCapacity} parking space${reso.parkingCapacity > 1 ? "s" : ""}`;
  }

  // ── Flooring ───────────────────────────────────────────────────
  const flooring = Array.isArray(reso.flooring) && reso.flooring.length
    ? reso.flooring.join(", ")
    : "";

  // ── Foundation ─────────────────────────────────────────────────
  const foundation = Array.isArray(reso.foundationDetails) && reso.foundationDetails.length
    ? reso.foundationDetails.join(", ")
    : (reso.basement || "");

  // ── Stories ────────────────────────────────────────────────────
  const stories = reso.stories ? `${reso.stories}` : (reso.levels || "");

  // ── Images ────────────────────────────────────────────────────
  const imageUrls = extractImages(prop);

  return {
    address: fullAddress,
    price,
    beds: (prop.bedrooms || reso.bedrooms || "").toString(),
    baths: (prop.bathrooms || reso.bathrooms || "").toString(),
    sqft: prop.livingArea
      ? Number(prop.livingArea).toLocaleString()
      : (prop.livingAreaValue?.toString() || ""),
    lotSize,
    yearBuilt: (prop.yearBuilt || reso.yearBuilt || "").toString(),
    propertyType: (prop.propertyTypeDimension || prop.homeType || reso.homeType || "")
      .replace(/_/g, " ")
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
    description: prop.description || "",
    imageUrls,
    homeStatus,
    zpid: prop.zpid ? String(prop.zpid) : null,
    garage,
    flooring,
    foundation,
    stories,
  };
}

function formatAddress(prop, fallbackAddress) {
  const addrObj = prop.address || {};
  const street = addrObj.streetAddress || prop.streetAddress || "";
  const city = addrObj.city || prop.city || "";
  const state = addrObj.state || prop.state || "";
  const zip = addrObj.zipcode || prop.zipcode || "";
  return [street, city, state, zip].filter(Boolean).join(", ") || fallbackAddress;
}

function extractImages(prop) {
  const images = [];

  // originalPhotos has the full set - pick the largest jpeg per photo
  if (Array.isArray(prop.originalPhotos)) {
    for (const photo of prop.originalPhotos) {
      const jpegs = photo?.mixedSources?.jpeg;
      if (Array.isArray(jpegs) && jpegs.length > 0) {
        // Pick the largest width available
        const largest = jpegs.reduce((a, b) => (b.width > a.width ? b : a));
        if (largest.url && !images.includes(largest.url)) {
          images.push(largest.url);
        }
      }
    }
  }

  // Fallback to hiResImageLink if no originalPhotos
  if (images.length === 0 && prop.hiResImageLink) {
    images.push(prop.hiResImageLink);
  }

  return images.slice(0, 30);
}
