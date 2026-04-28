import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Image } from '../icons'

export default function ImageGallery({ images, floorPlanUrl }) {
  const [lightbox, setLightbox] = useState(null)
  const allImages = [...(images || []), ...(floorPlanUrl ? [floorPlanUrl] : [])]

  if (!allImages.length) {
    return (
      <div className="flex items-center justify-center h-48 bg-stone-800 rounded-2xl">
        <div className="text-center text-stone-600">
          <Image size={32} className="mx-auto mb-2" />
          <p className="text-sm">No images available</p>
        </div>
      </div>
    )
  }

  const prev = () => setLightbox(l => (l - 1 + allImages.length) % allImages.length)
  const next = () => setLightbox(l => (l + 1) % allImages.length)

  return (
    <>
      {/* Horizontal scroll gallery */}
      <div className="flex gap-2 overflow-x-auto gallery-scroll pb-2 -mx-4 px-4">
        {allImages.map((url, i) => (
          <div
            key={i}
            className="gallery-item relative shrink-0 w-64 h-44 md:w-80 md:h-56 rounded-xl overflow-hidden bg-stone-800 cursor-pointer active:scale-95 transition-transform"
            onClick={() => setLightbox(i)}
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover"
              onError={e => {
                e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-stone-600 text-xs">Image unavailable</div>`
              }}
            />
            {i === allImages.length - 1 && floorPlanUrl && (
              <div className="absolute bottom-2 left-2 bg-stone-950/80 text-amber-400 text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                Floor Plan
              </div>
            )}
            <div className="absolute top-2 right-2 bg-stone-950/60 text-stone-300 text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
              {i + 1}/{allImages.length}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/95 flex items-center justify-center animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 bg-stone-800 text-stone-300 p-2 rounded-full z-10"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>

          <button
            className="absolute left-4 bg-stone-800/80 text-stone-300 p-3 rounded-full z-10"
            onClick={e => { e.stopPropagation(); prev() }}
          >
            <ChevronLeft size={24} />
          </button>

          <img
            src={allImages[lightbox]}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90dvh', maxWidth: '95vw' }}
          />

          <button
            className="absolute right-4 bg-stone-800/80 text-stone-300 p-3 rounded-full z-10"
            onClick={e => { e.stopPropagation(); next() }}
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-6 text-stone-500 text-sm">
            {lightbox + 1} / {allImages.length}
            {lightbox === allImages.length - 1 && floorPlanUrl && ' • Floor Plan'}
          </div>
        </div>
      )}
    </>
  )
}
