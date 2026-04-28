// netlify/functions/scrape.js
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  let url
  try {
    url = JSON.parse(event.body).url
    if (!url) throw new Error('No URL')
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  console.log('Scraping:', url)

  try {
    const data = await scrapeZillow(url)
    console.log('Success:', data.address)
    return { statusCode: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
  } catch (err) {
    console.error('Failed:', err.message)
    return { statusCode: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
}

async function scrapeZillow(url) {
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ]

  let html = null
  let lastError = null

  for (const ua of userAgents) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      })
      console.log('Status:', response.status, '| UA:', ua.substring(0, 50))
      if (response.status === 200) { html = await response.text(); break }
      lastError = `HTTP ${response.status}`
    } catch (err) {
      lastError = err.message
    }
  }

  if (!html) throw new Error(lastError || 'All fetch attempts failed')
  console.log('HTML length:', html.length)

  if (html.length < 5000 || html.includes('"captcha"')) {
    throw new Error('Zillow is showing a bot-detection page — try again in a moment')
  }

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch) throw new Error('Could not find listing data in Zillow page')

  return parseZillowData(JSON.parse(nextDataMatch[1]))
}

function parseZillowData(nextData) {
  const props = nextData?.props?.pageProps
  let property = null

  const gdpClientCache = props?.componentProps?.gdpClientCache
  if (gdpClientCache) {
    try {
      const cacheData = JSON.parse(gdpClientCache)
      for (const key of Object.keys(cacheData)) {
        if (cacheData[key]?.property) { property = cacheData[key].property; break }
      }
    } catch (e) { console.log('gdpClientCache parse failed:', e.message) }
  }

  if (!property) property = props?.initialReduxState?.gdp?.propertyData
  if (!property) property = props?.property
  if (!property) property = props?.homeDetails

  if (!property) {
    console.error('pageProps keys:', Object.keys(props || {}))
    throw new Error('Could not locate property data within Zillow page')
  }

  const imageUrls = extractImages(property)
  const price = property.price
    ? `$${Number(property.price).toLocaleString()}`
    : property.zestimate ? `$${Number(property.zestimate).toLocaleString()} (Zestimate)` : ''

  return {
    address: [property.streetAddress, property.city, property.state, property.zipcode].filter(Boolean).join(', '),
    price,
    beds: property.bedrooms?.toString() || '',
    baths: property.bathrooms?.toString() || '',
    sqft: property.livingArea ? Number(property.livingArea).toLocaleString() : '',
    lotSize: property.lotAreaValue ? `${property.lotAreaValue} ${property.lotAreaUnit || 'sqft'}` : '',
    yearBuilt: property.yearBuilt?.toString() || '',
    propertyType: (property.propertyTypeDimension || property.homeType || '').replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
    description: property.description || '',
    imageUrls,
  }
}

function extractImages(property) {
  const images = []
  if (property.hiResImageLink) images.push(property.hiResImageLink)
  for (const photos of [property.originalPhotos, property.photos, property.responsivePhotos, property.hugePhotos]) {
    if (!Array.isArray(photos)) continue
    for (const photo of photos) {
      const url = typeof photo === 'string' ? photo
        : photo?.url || photo?.mixedSources?.jpeg?.[0]?.url || photo?.mixedSources?.webp?.[0]?.url || photo?.src || null
      if (url && !images.includes(url)) images.push(url)
    }
    if (images.length >= 5) break
  }
  return images.slice(0, 30)
}
