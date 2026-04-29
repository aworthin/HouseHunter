import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, ClipboardList } from '../icons'
import { useHouses } from '../App'
import { updateHouse, changeStatus, addHistory, STATUS } from '../lib/db'

export default function TourModePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { houses, toured } = useHouses()
  const house = houses.find(h => h.id === id)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    tourDate: house?.tourDate || today,
    tourNotes: house?.tourNotes || '',
    tourPros: house?.tourPros || '',
    tourCons: house?.tourCons || '',
    tourOverallRating: house?.tourOverallRating || 0,
  })
  const [saving, setSaving] = useState(false)

  if (!house) return null

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const wasAlreadyToured = house.status === STATUS.TOURED
      const newRank = wasAlreadyToured ? house.rank : (toured.length + 1)
      await updateHouse(id, { ...form, rank: newRank })
      if (!wasAlreadyToured) {
        await changeStatus(house, STATUS.TOURED)
      } else {
        await addHistory({
          houseId: id, address: house.address, event: 'toured',
          fromStatus: STATUS.TOURED, toStatus: STATUS.TOURED, note: 'Tour notes updated'
        })
      }
      if (!wasAlreadyToured) {
        navigate('/ranking', { state: { highlightId: id } })
      } else {
        navigate(`/house/${id}`)
      }
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
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-stone-100">Tour Mode</h1>
          <p className="text-stone-500 text-xs truncate">{house.address}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-4 text-sm disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Tour'}
        </button>
      </div>

      <div className="px-4 py-6 space-y-6 pb-16">
        {/* Banner */}
        <div className="card p-4 flex items-center gap-3 border-amber-500/30 bg-amber-500/5">
          <ClipboardList size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-amber-400 font-medium text-sm">Tour Mode Active</p>
            <p className="text-stone-500 text-xs">Capture your impressions while you're here</p>
          </div>
        </div>

        {/* Tour Date */}
        <div>
          <label className="label">Tour Date</label>
          <input
            className="input"
            type="date"
            value={form.tourDate}
            onChange={e => set('tourDate', e.target.value)}
          />
        </div>

        {/* Overall Rating */}
        <div>
          <label className="label">Overall Rating</label>
          <div className="flex gap-3 mt-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => set('tourOverallRating', n)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                  n <= form.tourOverallRating
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-600 border border-stone-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-stone-600 text-xs mt-2 text-center">
            {form.tourOverallRating === 0 && 'Tap to rate'}
            {form.tourOverallRating === 1 && 'Not a fit'}
            {form.tourOverallRating === 2 && 'Some concerns'}
            {form.tourOverallRating === 3 && 'Decent option'}
            {form.tourOverallRating === 4 && 'Really like it'}
            {form.tourOverallRating === 5 && '⭐ Love it!'}
          </p>
        </div>

        {/* General impressions */}
        <div>
          <label className="label">First Impressions & General Notes</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="How does it feel? What stands out? Neighborhood vibe, curb appeal..."
            value={form.tourNotes}
            onChange={e => set('tourNotes', e.target.value)}
          />
        </div>

        {/* Pros */}
        <div>
          <label className="label">What You Love</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Layout, light, yard, kitchen, closets..."
            value={form.tourPros}
            onChange={e => set('tourPros', e.target.value)}
          />
        </div>

        {/* Cons */}
        <div>
          <label className="label">Concerns / Issues</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Things that need work, deal breakers, questions to follow up..."
            value={form.tourCons}
            onChange={e => set('tourCons', e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? 'Saving...' : house.status === STATUS.TOURED ? 'Update Tour Notes' : 'Save & Rank This House'}
        </button>
      </div>
    </div>
  )
}
