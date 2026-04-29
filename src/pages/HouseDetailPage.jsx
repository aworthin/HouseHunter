import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit2, MapPin, Bed, Bath, Square, Calendar,
  ExternalLink, Trash2, ClipboardList, Trophy, Home,
  Eye, ThumbsDown, Car, Layers, Tag
} from '../icons'
import { useHouses } from '../App'
import { deleteHouse, changeStatus, STATUS, STATUS_LABELS } from '../lib/db'
import ImageGallery from '../components/ImageGallery'
import ConfirmDialog from '../components/ConfirmDialog'

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-stone-800 last:border-0">
      <div className="w-8 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-stone-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-stone-500 text-xs">{label}</p>
        <p className="text-stone-200 text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

const STATUS_BADGE = {
  [STATUS.NEW]: 'bg-stone-700 text-stone-300',
  [STATUS.REVIEWED]: 'bg-blue-900/60 text-blue-300',
  [STATUS.TOURED]: 'bg-amber-500/20 text-amber-400',
  [STATUS.REJECTED]: 'bg-red-950/60 text-red-400',
  [STATUS.SOLD]: 'bg-red-900/40 text-red-300',
}

export default function HouseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { houses } = useHouses()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [acting, setActing] = useState(false)

  const house = houses.find(h => h.id === id)

  if (!house) return (
    <div className="min-h-dvh bg-stone-950 flex items-center justify-center">
      <div className="text-center">
        <Home size={48} className="text-stone-700 mx-auto mb-4" />
        <p className="text-stone-400">House not found</p>
        <button onClick={() => navigate('/')} className="text-amber-500 text-sm mt-2">Go home</button>
      </div>
    </div>
  )

  async function handleDelete() {
    await deleteHouse(house)
    navigate('/')
  }

  async function handleMarkReviewed() {
    setActing(true)
    await changeStatus(house, STATUS.REVIEWED)
    setActing(false)
  }

  async function handleReject() {
    setActing(true)
    await changeStatus(house, STATUS.REJECTED)
    setActing(false)
    setConfirmReject(false)
  }

  async function handleUnreject() {
    setActing(true)
    await changeStatus(house, STATUS.NEW, 'Moved back from Rejected')
    setActing(false)
  }

  const needsDeleteConfirm = house.status !== STATUS.NEW

  return (
    <div className="min-h-dvh bg-stone-950">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-stone-100 font-medium text-sm truncate">{house.address || 'House Details'}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[house.status] || ''}`}>
            {STATUS_LABELS[house.status] || house.status}
            {house.status === STATUS.TOURED && house.rank ? ` · Rank #${house.rank}` : ''}
          </span>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 pb-40">
        {/* Images */}
        <ImageGallery images={house.imageUrls} floorPlanUrl={house.floorPlanUrl} />

        {/* Price & Address */}
        <div>
          {house.price && (
            <p className="text-amber-400 font-semibold text-2xl font-display mb-1">{house.price}</p>
          )}
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-stone-500 mt-0.5 shrink-0" />
            <p className="text-stone-300 text-sm">{house.address || 'Address not set'}</p>
          </div>
        </div>

        {/* Quick stats */}
        {(house.beds || house.baths || house.sqft) && (
          <div className="grid grid-cols-3 gap-3">
            {house.beds && <div className="card p-3 text-center"><Bed size={18} className="text-stone-500 mx-auto mb-1" /><p className="text-stone-100 font-semibold">{house.beds}</p><p className="text-stone-500 text-xs">Beds</p></div>}
            {house.baths && <div className="card p-3 text-center"><Bath size={18} className="text-stone-500 mx-auto mb-1" /><p className="text-stone-100 font-semibold">{house.baths}</p><p className="text-stone-500 text-xs">Baths</p></div>}
            {house.sqft && <div className="card p-3 text-center"><Square size={18} className="text-stone-500 mx-auto mb-1" /><p className="text-stone-100 font-semibold">{house.sqft}</p><p className="text-stone-500 text-xs">Sq Ft</p></div>}
          </div>
        )}

        {/* Details */}
        <div className="card px-4">
          <InfoRow icon={Calendar} label="Year Built" value={house.yearBuilt} />
          <InfoRow icon={Square} label="Lot Size" value={house.lotSize} />
          <InfoRow icon={Home} label="Property Type" value={house.propertyType} />
          <InfoRow icon={Car} label="Garage / Parking" value={house.garage} />
          <InfoRow icon={Layers} label="Flooring" value={house.flooring} />
          <InfoRow icon={Home} label="Foundation" value={house.foundation} />
          <InfoRow icon={Home} label="Stories" value={house.stories} />
          <InfoRow icon={Tag} label="Construction" value={house.materials} />
          <InfoRow icon={Home} label="Roof" value={house.roof} />
          <InfoRow icon={Tag} label="HOA Fee" value={house.hoaFee} />
          <InfoRow icon={Tag} label="Heating" value={house.heating} />
          <InfoRow icon={Tag} label="Cooling" value={house.cooling} />
        </div>

        {/* Description */}
        {house.description && (
          <div>
            <p className="label mb-2">Description</p>
            <p className="text-stone-400 text-sm leading-relaxed">{house.description}</p>
          </div>
        )}

        {/* Notes */}
        {house.notes && (
          <div className="card p-4 border-l-2 border-l-amber-500">
            <p className="label mb-1">Your Notes</p>
            <p className="text-stone-300 text-sm leading-relaxed">{house.notes}</p>
          </div>
        )}

        {/* Tour data */}
        {house.status === STATUS.TOURED && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={15} className="text-amber-500" />
              <p className="text-stone-300 font-medium text-sm">Tour Notes</p>
            </div>
            {house.tourDate && <div><p className="label">Tour Date</p><p className="text-stone-300 text-sm">{house.tourDate}</p></div>}
            {house.tourNotes && <div><p className="label">Impressions</p><p className="text-stone-300 text-sm leading-relaxed">{house.tourNotes}</p></div>}
            {house.tourPros && <div><p className="label">Pros</p><p className="text-stone-300 text-sm leading-relaxed">{house.tourPros}</p></div>}
            {house.tourCons && <div><p className="label">Cons</p><p className="text-stone-300 text-sm leading-relaxed">{house.tourCons}</p></div>}
            {house.tourOverallRating > 0 && (
              <div>
                <p className="label">Overall Rating</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${n <= house.tourOverallRating ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-600'}`}>{n}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Zillow link */}
        {house.zillowUrl && (
          <a href={house.zillowUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-stone-400 text-sm hover:text-amber-400 transition-colors">
            <ExternalLink size={14} />
            View on Zillow
          </a>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 px-4 pt-3 safe-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Row 1: primary actions */}
          <div className="flex gap-2">
            <button onClick={() => navigate(`/house/${id}/edit`)}
              className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-3">
              <Edit2 size={15} /> Edit
            </button>

            {house.status === STATUS.NEW && (
              <button onClick={handleMarkReviewed} disabled={acting}
                className="bg-blue-900/60 text-blue-300 border border-blue-800 font-medium flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl active:scale-95 transition-all disabled:opacity-40">
                <Eye size={15} /> Mark Reviewed
              </button>
            )}

            {(house.status === STATUS.REVIEWED || house.status === STATUS.TOURED) && (
              <button onClick={() => navigate(`/house/${id}/tour`)}
                className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-3">
                <ClipboardList size={15} />
                {house.status === STATUS.TOURED ? 'Update Tour' : 'Tour Mode'}
              </button>
            )}

            {house.status === STATUS.REJECTED && (
              <button onClick={handleUnreject} disabled={acting}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-3">
                <Home size={15} /> Move to New
              </button>
            )}
          </div>

          {/* Row 2: destructive actions */}
          {house.status !== STATUS.REJECTED && house.status !== STATUS.SOLD && (
            <div className="flex gap-2">
              <button onClick={() => setConfirmReject(true)}
                className="btn-danger flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm">
                <ThumbsDown size={14} /> Reject
              </button>
              <button onClick={() => needsDeleteConfirm ? setConfirmDelete(true) : handleDelete()}
                className="bg-stone-900 text-stone-500 border border-stone-800 font-medium flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-95 transition-all text-sm">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}

          {(house.status === STATUS.REJECTED || house.status === STATUS.SOLD) && (
            <button onClick={() => needsDeleteConfirm ? setConfirmDelete(true) : handleDelete()}
              className="btn-danger w-full flex items-center justify-center gap-2 py-2.5 text-sm">
              <Trash2 size={14} /> Delete Permanently
            </button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this house?"
          message={`"${house.address}" will be permanently removed. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          confirmLabel="Delete"
        />
      )}
      {confirmReject && (
        <ConfirmDialog
          title="Reject this house?"
          message={`"${house.address}" will be moved to the Rejected list. You can undo this later.`}
          onConfirm={handleReject}
          onCancel={() => setConfirmReject(false)}
          confirmLabel="Reject"
          danger={true}
        />
      )}
    </div>
  )
}
