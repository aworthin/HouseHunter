import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from '../icons'
import { useHouses } from '../App'
import { updateHouse } from '../lib/db'

export default function EditHousePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { houses } = useHouses()
  const house = houses.find(h => h.id === id)

  const [form, setForm] = useState(house ? {
    address: house.address || '',
    price: house.price || '',
    beds: house.beds || '',
    baths: house.baths || '',
    sqft: house.sqft || '',
    lotSize: house.lotSize || '',
    yearBuilt: house.yearBuilt || '',
    propertyType: house.propertyType || '',
    description: house.description || '',
    floorPlanUrl: house.floorPlanUrl || '',
    notes: house.notes || '',
    zillowUrl: house.zillowUrl || '',
    garage: house.garage || '',
    flooring: house.flooring || '',
    foundation: house.foundation || '',
    stories: house.stories || '',
  } : {})

  const [saving, setSaving] = useState(false)

  if (!house) return null

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateHouse(id, form)
      navigate(`/house/${id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-stone-950">
      <div className="page-header" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-semibold text-stone-100 flex-1">Edit House</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-4 text-sm disabled:opacity-40">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="px-4 py-6 space-y-5 pb-16">
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">List Price</label>
            <input className="input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="$450,000" />
          </div>
          <div>
            <label className="label">Property Type</label>
            <input className="input" value={form.propertyType} onChange={e => set('propertyType', e.target.value)} placeholder="Single Family" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Beds</label>
            <input className="input" value={form.beds} onChange={e => set('beds', e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="label">Baths</label>
            <input className="input" value={form.baths} onChange={e => set('baths', e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className="label">Sq Ft</label>
            <input className="input" value={form.sqft} onChange={e => set('sqft', e.target.value)} inputMode="decimal" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Lot Size</label>
            <input className="input" value={form.lotSize} onChange={e => set('lotSize', e.target.value)} placeholder="0.25 acres" />
          </div>
          <div>
            <label className="label">Year Built</label>
            <input className="input" value={form.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} inputMode="numeric" />
          </div>
        </div>

        <div>
          <label className="label">Garage / Parking</label>
          <input className="input" value={form.garage} onChange={e => set('garage', e.target.value)} placeholder="2-car Attached Garage" />
        </div>

        <div>
          <label className="label">Stories</label>
          <input className="input" value={form.stories} onChange={e => set('stories', e.target.value)} inputMode="numeric" />
        </div>

        <div>
          <label className="label">Flooring</label>
          <input className="input" value={form.flooring} onChange={e => set('flooring', e.target.value)} placeholder="Carpet, LVP, Tile" />
        </div>

        <div>
          <label className="label">Zillow URL</label>
          <input className="input" value={form.zillowUrl} onChange={e => set('zillowUrl', e.target.value)} type="url" inputMode="url" placeholder="https://zillow.com/..." />
        </div>

        <div>
          <label className="label">Floor Plan Image URL</label>
          <input className="input" value={form.floorPlanUrl} onChange={e => set('floorPlanUrl', e.target.value)} type="url" inputMode="url" placeholder="https://... (any source)" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Listing description..." />
        </div>

        <div>
          <label className="label">Your Notes</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Thoughts, things to check..." />
        </div>
      </div>
    </div>
  )
}
