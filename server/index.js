// server/index.js - Express server for Docker deployment
// This wraps the same scraper logic as the Netlify function

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Serve built React app
app.use(express.static(path.join(__dirname, '../dist')))

// Scraper endpoint (same logic as netlify function)
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No URL provided' })

  try {
    const data = await scrapeZillow(url)
    res.json(data)
  } catch (err) {
    console.error('Scrape error:', err.message)
    res.status(200).json({ error: err.message || 'Failed to scrape listing' })
  }
})

// All other routes → React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`HouseHunter server running on port ${PORT}`)
})

// ---- Scraper (same as netlify function) ----

async function scrapeZillow(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    }
  })

  if (!response.ok) throw new Error(`Zillow returned ${response.status}`)

  const html = await response.text()
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!nextDataMatch) throw new Error('Could not find listing data on page')

  const nextData = JSON.parse(nextDataMatch[1])
  const props = nextData?.props?.pageProps
  const gdpClientCache = props?.componentProps?.gdpClientCache

  let property = null

  if (gdpClientCache) {
    try {
      const cacheData = JSON.parse(gdpClientCache)
      for (const key of Object.keys(cacheData)) {
        if (cacheData[key]?.property) { property = cacheData[key].property; break }
      }
    } catch {}
  }

  if (!property) property = props?.initialReduxState?.gdp?.propertyData
  if (!property) throw new Error('Could not parse listing data from Zillow page')

  const imageUrls = extractImages(property)
  const price = property.price
    ? `$${property.price.toLocaleString()}`
    : property.zestimate ? `$${property.zestimate.toLocaleString()} (Zestimate)` : ''

  return {
    address: [property.streetAddress, property.city, property.state, property.zipcode].filter(Boolean).join(', '),
    price,
    beds: property.bedrooms?.toString() || '',
    baths: property.bathrooms?.toString() || '',
    sqft: property.livingArea ? property.livingArea.toLocaleString() : '',
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
  for (const photos of [property.originalPhotos, property.photos, property.responsivePhotos]) {
    if (Array.isArray(photos)) {
      for (const photo of photos) {
        const url = typeof photo === 'string' ? photo
          : photo?.url || photo?.mixedSources?.jpeg?.[0]?.url || photo?.src || null
        if (url && !images.includes(url)) images.push(url)
      }
      if (images.length > 3) break
    }
  }
  return images.slice(0, 30)
}
