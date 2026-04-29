import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bed, Bath, Square, GripVertical } from '../icons'
import { STATUS, STATUS_LABELS } from '../lib/db'
import AddressActionSheet from './AddressActionSheet'

const STATUS_BADGE = {
  [STATUS.NEW]: 'bg-stone-700 text-stone-300',
  [STATUS.REVIEWED]: 'bg-blue-900/60 text-blue-300',
  [STATUS.TOURED]: 'bg-amber-500/20 text-amber-400',
  [STATUS.REJECTED]: 'bg-red-950/60 text-red-400',
  [STATUS.SOLD]: 'bg-red-900/40 text-red-300',
}

export default function HouseCard({ house, rank, dragHandleProps, isDragging }) {
  const navigate = useNavigate()
  const [showAddress, setShowAddress] = useState(false)
  const img = house.imageUrls?.[0]

  return (
    <>
      <div
        className={`card flex overflow-hidden transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95' : 'active:scale-[0.98]'
        }`}
      >
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="drag-handle flex items-center justify-center px-3 bg-stone-800/50 border-r border-stone-800"
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={16} className="text-stone-600" />
          </div>
        )}

        <div className="flex flex-1 cursor-pointer min-w-0" onClick={() => navigate(`/house/${house.id}`)}>
          {/* Image */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 bg-stone-800">
            {img ? (
              <img src={img} alt={house.address} className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin size={20} className="text-stone-600" />
              </div>
            )}
            {rank && (
              <div className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {rank}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              {/* Address — tappable separately from card */}
              <button
                className="text-left flex-1 min-w-0"
                onClick={e => {
                  e.stopPropagation()
                  if (house.address) setShowAddress(true)
                }}
              >
                <p className="font-display font-semibold text-stone-100 text-sm leading-tight line-clamp-2 underline-offset-2 active:text-amber-400 transition-colors">
                  {house.address || 'Address pending'}
                </p>
              </button>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[house.status] || STATUS_BADGE[STATUS.NEW]}`}>
                {STATUS_LABELS[house.status] || house.status}
              </span>
            </div>

            {house.price && (
              <p className="text-amber-400 font-semibold text-sm mb-2">{house.price}</p>
            )}
            <div className="flex items-center gap-3 text-stone-500 text-xs">
              {house.beds && <span className="flex items-center gap-1"><Bed size={11} /> {house.beds}bd</span>}
              {house.baths && <span className="flex items-center gap-1"><Bath size={11} /> {house.baths}ba</span>}
              {house.sqft && <span className="flex items-center gap-1"><Square size={11} /> {house.sqft}</span>}
            </div>
            {house.tourNotes && (
              <p className="text-stone-500 text-xs mt-1 line-clamp-1 italic">"{house.tourNotes}"</p>
            )}
          </div>
        </div>
      </div>

      {showAddress && (
        <AddressActionSheet
          address={house.address}
          onClose={() => setShowAddress(false)}
        />
      )}
    </>
  )
}
