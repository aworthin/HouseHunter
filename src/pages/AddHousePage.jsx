import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Link2, Loader2, AlertCircle, CheckCircle } from '../icons'
import { addHouse } from '../lib/db'

// Firebase function (Google Cloud IP - less likely to be blocked)
// Falls back to Netlify function if Firebase isn't available
const FIREBASE_SCRAPER = 'https://scrape-ykoka77lva-uc.a.run.app'
const NETLIFY_SCRAPER = '/api/scrape'

async function fetchScrape(url) {
  // Try Firebase first
  try {
    const res = await fetch(FIREBASE_SCRAPER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20000)
    })
    if (res.ok) return res.json()
  } catch (e) {
    console.log('Firebase scraper unavailable, trying Netlify:', e.message)
  }
  // Fall back to Netlify
  const res = await fetch(NETLIFY_SCRAPER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  })
  return res.json()
}

const EMPTY_FORM = {
  zillowUrl: '',
  address: '',
  price: '',
  beds: '',
  baths: '',
  sqft: '',
  lotSize: '',
  yearBuilt: '',
  propertyType: '',
  description: '',
  imageUrls: [],
  floorPlanUrl: '',
  notes: '',
}

export default function AddHousePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState(EMPTY_FORM)
  const [scraping, setScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState(null)
  const [scrapeMsg, setScrapeMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Auto-trigger scrape when opened from iOS Shortcut with ?zillow=URL
  useEffect(() => {
    const zillowParam = searchParams.get('zillow')
    if (zillowParam && zillowParam.includes('zillow.com')) {
      setForm(f => ({ ...f, zillowUrl: zillowParam }))
      runScrape(zillowParam)
    }
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function runScrape(url) {
    setScraping(true)
    setScrapeStatus(null)
    try {
      const data = await fetchScrape(url)

      if (data._partial) {
        if (data.address) setForm(f => ({ ...f, zillowUrl: url, address: data.address }))
        setScrapeStatus('partial')
        setScrapeMsg('Zillow limited the data — address pre-filled. Please complete the remaining fields.')
      } else if (data.error) {
        setForm(f => ({ ...f, zillowUrl: url }))
        setScrapeStatus('error')
        setScrapeMsg('Could not pull data from Zillow — please fill in details manually below.')
      } else {
        setForm(f => ({ ...f, zillowUrl: url, ...data }))
        setScrapeStatus('success')
        setScrapeMsg(`Loaded: ${data.address || 'listing details pulled successfully'}`)
      }
    } catch (err) {
      setForm(f => ({ ...f, zillowUrl: url }))
      setScrapeStatus('error')
      setScrapeMsg('Could not pull data from Zillow — please fill in details manually below.')
    } finally {
      setScraping(false)
    }
  }

  async function handleScrape() {
    if (!form.zillowUrl.includes('zillow.com')) {
      setScrapeStatus('error')
      setScrapeMsg('Please enter a valid Zillow listing URL')
      return
    }
    runScrape(form.zillowUrl)
  }

  async function handleSave() {
    if (!form.address && !form.zillowUrl) return
    setSaving(true)
    try {
      await addHouse({
        zillowUrl: form.zillowUrl,
        address: form.address,
        price: form.price,
        beds: form.beds,
        baths: form.baths,
        sqft: form.sqft,
        lotSize: form.lotSize,
        yearBuilt: form.yearBuilt,
        propertyType: form.propertyType,
        description: form.description,
        imageUrls: form.imageUrls,
        floorPlanUrl: form.floorPlanUrl,
        notes: form.notes,
      })
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-stone-950">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-semibold text-stone-100 flex-1">
          {scraping ? 'Loading Listing...' : 'Add House'}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving || (!form.address && !form.zillowUrl)}
          className="btn-primary py-2 px-4 text-sm disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="px-4 py-6 space-y-6 pb-16">
        {/* Zillow URL */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={16} className="text-amber-500" />
            <p className="text-stone-300 font-medium text-sm">Zillow Listing URL</p>
          </div>
          <input
            className="input"
            placeholder="https://www.zillow.com/homedetails/..."
            value={form.zillowUrl}
            onChange={e => set('zillowUrl', e.target.value)}
            type="url"
            inputMode="url"
          />
          <button
            onClick={handleScrape}
            disabled={scraping || !form.zillowUrl}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {scraping ? (
              <><Loader2 size={16} className="animate-spin" /> Pulling from Zillow...</>
            ) : (
              'Pull Listing Details'
            )}
          </button>

          {scrapeStatus && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              scrapeStatus === 'success'
                ? 'bg-green-950/50 text-green-400 border border-green-900'
                : scrapeStatus === 'partial'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-900'
                : 'bg-red-950/50 text-red-400 border border-red-900'
            }`}>
              {scrapeStatus === 'success'
                ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
                : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              {scrapeMsg}
            </div>
          )}
        </div>

        {/* Loading overlay while auto-scraping from shortcut */}
        {scraping && (
          <div className="card p-6 flex flex-col items-center gap-3 border-amber-500/20">
            <Loader2 size={28} className="animate-spin text-amber-500" />
            <p className="text-stone-300 text-sm font-medium">Pulling listing details from Zillow...</p>
            <p className="text-stone-500 text-xs text-center">This usually takes a few seconds</p>
          </div>
        )}

        {/* Address */}
        <div>
          <label className="label">Address *</label>
          <input
            className="input"
            placeholder="123 Main St, City, State ZIP"
            value={form.address}
            onChange={e => set('address', e.target.value)}
          />
        </div>

        {/* Price & Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">List Price</label>
            <input className="input" placeholder="$450,000" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className="label">Property Type</label>
            <input className="input" placeholder="Single Family" value={form.propertyType} onChange={e => set('propertyType', e.target.value)} />
          </div>
        </div>

        {/* Beds / Baths / Sqft */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Beds</label>
            <input className="input" placeholder="3" value={form.beds} onChange={e => set('beds', e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="label">Baths</label>
            <input className="input" placeholder="2" value={form.baths} onChange={e => set('baths', e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="label">Sq Ft</label>
            <input className="input" placeholder="1,800" value={form.sqft} onChange={e => set('sqft', e.target.value)} inputMode="decimal" />
          </div>
        </div>

        {/* Lot / Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Lot Size</label>
            <input className="input" placeholder="0.25 acres" value={form.lotSize} onChange={e => set('lotSize', e.target.value)} />
          </div>
          <div>
            <label className="label">Year Built</label>
            <input className="input" placeholder="1995" value={form.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} inputMode="numeric" />
          </div>
        </div>

        {/* Floor Plan URL */}
        <div>
          <label className="label">Floor Plan Image URL</label>
          <input
            className="input"
            placeholder="https://... (any source)"
            value={form.floorPlanUrl}
            onChange={e => set('floorPlanUrl', e.target.value)}
            type="url"
            inputMode="url"
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Listing description..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Your Notes</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Initial thoughts, reasons to consider..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        {/* Images pulled */}
        {form.imageUrls.length > 0 && (
          <div>
            <label className="label">{form.imageUrls.length} images pulled from Zillow</label>
            <div className="flex gap-2 overflow-x-auto gallery-scroll pb-2">
              {form.imageUrls.slice(0, 6).map((url, i) => (
                <img key={i} src={url} alt="" className="h-20 w-28 object-cover rounded-lg shrink-0" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
