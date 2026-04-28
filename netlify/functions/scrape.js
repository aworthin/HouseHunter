// netlify/functions/scrape.js
// Zillow scraper - pulls listing data from Zillow's embedded JSON

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let url
  try {
    const body = JSON.parse(event.body)
    url = body.url
    if (!url) throw new Error('No URL provided')
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  try {
    const data = await scrapeZillow(url)
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (err) {
    console.error('Scrape error:', err)
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to scrape listing' })
    }
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
}

async function scrapeZillow(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
    }
  })

  if (!response.ok) {
    throw new Error(`Zillow returned ${response.status}`)
  }

  const html = await response.text()

  // Zillow embeds all listing data in a __NEXT_DATA__ script tag as JSON
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch) {
    throw new Error('Could not find listing data on page')
  }

  const nextData = JSON.parse(nextDataMatch[1])

  // Navigate to the property data
  const props = nextData?.props?.pageProps
  const gdpClientCache = props?.componentProps?.gdpClientCache
  const initialReduxState = props?.initialReduxState

  let property = null

  // Try gdpClientCache first (newer Zillow format)
  if (gdpClientCache) {
    try {
      const cacheData = JSON.parse(gdpClientCache)
      const keys = Object.keys(cacheData)
      for (const key of keys) {
        const item = cacheData[key]
        if (item?.property) {
          property = item.property
          break
        }
      }
    } catch {}
  }

  // Try initialReduxState (older format)
  if (!property && initialReduxState) {
    property = initialReduxState?.gdp?.propertyData
  }

  // Try another common path
  if (!property) {
    property = props?.gdpClientCache ? null : props?.property
  }

  if (!property) {
    throw new Error('Could not parse listing data from Zillow page')
  }

  // Extract images
  const imageUrls = extractImages(property)

  // Format price
  const price = property.price
    ? `$${property.price.toLocaleString()}`
    : property.zestimate
    ? `$${property.zestimate.toLocaleString()} (Zestimate)`
    : ''

  return {
    address: formatAddress(property),
    price,
    beds: property.bedrooms?.toString() || '',
    baths: property.bathrooms?.toString() || '',
    sqft: property.livingArea ? property.livingArea.toLocaleString() : '',
    lotSize: property.lotAreaValue
      ? `${property.lotAreaValue} ${property.lotAreaUnit || 'sqft'}`
      : '',
    yearBuilt: property.yearBuilt?.toString() || '',
    propertyType: formatPropertyType(property.propertyTypeDimension || property.homeType),
    description: property.description || '',
    imageUrls,
    zestimate: property.zestimate ? `$${property.zestimate.toLocaleString()}` : '',
  }
}

function formatAddress(property) {
  const parts = [
    property.streetAddress,
    property.city,
    property.state,
    property.zipcode
  ].filter(Boolean)
  return parts.join(', ')
}

function extractImages(property) {
  const images = []

  // Main hero image
  if (property.hiResImageLink) images.push(property.hiResImageLink)

  // All photos from various possible paths
  const photoPaths = [
    property.originalPhotos,
    property.photos,
    property.responsivePhotos,
    property.hugePhotos,
  ]

  for (const photos of photoPaths) {
    if (Array.isArray(photos)) {
      for (const photo of photos) {
        let photoUrl = null
        if (typeof photo === 'string') photoUrl = photo
        else if (photo?.url) photoUrl = photo.url
        else if (photo?.mixedSources?.jpeg?.[0]?.url) photoUrl = photo.mixedSources.jpeg[0].url
        else if (photo?.src) photoUrl = photo.src

        if (photoUrl && !images.includes(photoUrl)) {
          images.push(photoUrl)
        }
      }
      if (images.length > 3) break // We have enough from first good source
    }
  }

  return images.slice(0, 30) // Cap at 30 images
}

function formatPropertyType(type) {
  if (!type) return ''
  return type
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
}
