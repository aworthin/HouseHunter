import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bed, Bath, Square, GripVertical, Trophy } from '../icons'

export default function HouseCard({ house, rank, dragHandleProps, isDragging }) {
  const navigate = useNavigate()
  const img = house.imageUrls?.[0]

  return (
    <div
      className={`card flex overflow-hidden transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'active:scale-[0.98]'
      }`}
      style={{ touchAction: dragHandleProps ? 'none' : undefined }}
    >
      {/* Drag handle for toured houses */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="drag-handle flex items-center justify-center px-3 bg-stone-800/50 border-r border-stone-800"
        >
          <GripVertical size={16} className="text-stone-600" />
        </div>
      )}

      {/* Tap area to navigate */}
      <div
        className="flex flex-1 cursor-pointer min-w-0"
        onClick={() => navigate(`/house/${house.id}`)}
      >
        {/* Image */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 bg-stone-800">
          {img ? (
            <img
              src={img}
              alt={house.address}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin size={20} className="text-stone-600" />
            </div>
          )}
          {/* Rank badge */}
          {rank && (
            <div className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {rank}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-display font-semibold text-stone-100 text-sm leading-tight line-clamp-2 flex-1">
              {house.address || 'Address pending'}
            </p>
            <span className={house.status === 'toured' ? 'badge-toured shrink-0' : 'badge-pending shrink-0'}>
              {house.status === 'toured' ? 'Toured' : 'Pending'}
            </span>
          </div>

          {house.price && (
            <p className="text-amber-400 font-semibold text-sm mb-2">
              {house.price}
            </p>
          )}

          <div className="flex items-center gap-3 text-stone-500 text-xs">
            {house.beds && (
              <span className="flex items-center gap-1">
                <Bed size={11} /> {house.beds}bd
              </span>
            )}
            {house.baths && (
              <span className="flex items-center gap-1">
                <Bath size={11} /> {house.baths}ba
              </span>
            )}
            {house.sqft && (
              <span className="flex items-center gap-1">
                <Square size={11} /> {house.sqft}
              </span>
            )}
          </div>

          {house.tourNotes && (
            <p className="text-stone-500 text-xs mt-1 line-clamp-1 italic">
              "{house.tourNotes}"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
