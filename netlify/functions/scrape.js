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

  console.log('=== SCRAPE START ===')
  console.log('URL:', url)

  const addressFromUrl = extractAddressFromUrl(url)
  console.log('Address from URL:', addressFromUrl)

  try {
    const data = await scrapeZillow(url)
    console.log('=== SCRAPE SUCCESS ===')
    console.log('Address:', data.address)
    console.log('Images:', data.imageUrls?.length)
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (err) {
    console.error('=== SCRAPE FAILED ===')
    console.error('Error:', err.message)
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message,
        address: addressFromUrl,
        _partial: true,
        _debug: err.message
      })
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

function extractAddressFromUrl(url) {
  try {
    const match = url.match(/homedetails\/([^/]+)\//)
    if (!match) return ''
    return match[1]
      .replace(/-(\d{5})(-\d+)?$/, ', $1')
      .replace(/-([A-Z]{2})-/, ', $1 ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  } catch { return '' }
}

async function scrapeZillow(url) {
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  ]

  let lastError = null

  for (const ua of userAgents) {
    try {
      console.log('Trying UA:', ua.substring(0, 60))
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      })

      console.log('HTTP status:', response.status)
      console.log('Content-Type:', response.headers.get('content-type'))

      if (response.status === 403) { lastError = 'Zillow returned 403 Forbidden (IP blocked)'; continue }
      if (response.status === 429) { lastError = 'Zillow returned 429 Too Many Requests (rate limited)'; continue }
      if (response.status === 301 || response.status === 302) { lastError = `Zillow redirected (${response.status})`; continue }
      if (response.status !== 200) { lastError = `Zillow returned HTTP ${response.status}`; continue }

      const html = await response.text()
      console.log('HTML length:', html.length)
      console.log('Has __NEXT_DATA__:', html.includes('__NEXT_DATA__'))
      console.log('Has captcha:', html.includes('captcha'))
      console.log('Has robot check:', html.includes('robot') || html.includes('Distil'))
      console.log('First 200 chars:', html.substring(0, 200).replace(/\n/g, ' '))

      if (html.length < 5000) {
        lastError = `Page too short (${html.length} chars) - likely bot detection`
        console.log('Short page content:', html.substring(0, 500))
        continue
      }

      if (html.includes('captcha') || html.includes('distil_r_captcha') || html.includes('cf-challenge')) {
        lastError = 'Zillow CAPTCHA / bot detection page'
        continue
      }

      if (!html.includes('__NEXT_DATA__')) {
        // Log what we got instead
        const titleMatch = html.match(/<title>(.*?)<\/title>/)
        console.log('Page title:', titleMatch?.[1] || 'no title found')
        lastError = 'No __NEXT_DATA__ found in page - Zillow may have changed structure or blocked request'
        continue
      }

      return parseZillowHtml(html)

    } catch (err) {
      console.error('Fetch error:', err.message)
      lastError = err.message
    }
  }

  throw new Error(lastError || 'All fetch attempts failed')
}

function parseZillowHtml(html) {
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch) throw new Error('Could not extract __NEXT_DATA__ content')

  let nextData
  try {
    nextData = JSON.parse(nextDataMatch[1])
  } catch (e) {
    throw new Error('Failed to parse __NEXT_DATA__ JSON: ' + e.message)
  }

  const props = nextData?.props?.pageProps
  console.log('pageProps keys:', Object.keys(props || {}).join(', '))

  let property = null

  // Path 1: gdpClientCache
  const gdpClientCache = props?.componentProps?.gdpClientCache
  if (gdpClientCache) {
    try {
      const cacheData = JSON.parse(gdpClientCache)
      const keys = Object.keys(cacheData)
      console.log('gdpClientCache keys:', keys.slice(0, 3).join(', '))
      for (const key of keys) {
        if (cacheData[key]?.property) {
          property = cacheData[key].property
          console.log('Found property via gdpClientCache')
          break
        }
      }
    } catch (e) { console.log('gdpClientCache parse failed:', e.message) }
  }

  // Path 2: initialReduxState
  if (!property) {
    property = props?.initialReduxState?.gdp?.propertyData
    if (property) console.log('Found property via initialReduxState')
  }

  // Path 3: direct
  if (!property) {
    property = props?.property || props?.homeDetails || props?.listingData
    if (property) console.log('Found property via direct props')
  }

  // Path 4: search deeper
  if (!property && props) {
    const str = JSON.stringify(props)
    const match = str.match(/"streetAddress":"([^"]+)"/)
    if (match) {
      console.log('Found streetAddress in props string - trying deep parse')
      // Try to find any object with streetAddress
      for (const key of Object.keys(props)) {
        const val = props[key]
        if (typeof val === 'object' && val?.streetAddress) {
          property = val
          console.log('Found property at props.' + key)
          break
        }
      }
    }
  }

  if (!property) {
    console.error('Could not find property. pageProps sample:', JSON.stringify(props).substring(0, 500))
    throw new Error('Property data not found in Zillow page structure')
  }

  console.log('Property keys:', Object.keys(property).slice(0, 10).join(', '))

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
    propertyType: (property.propertyTypeDimension || property.homeType || '')
      .replace(/_/g, ' ')
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
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
