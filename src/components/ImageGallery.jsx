import React, { useState, useRef } from 'react'
import { PdfViewer, PdfThumbnail } from './PdfViewer'
import { isPdf } from '../lib/pdfRenderer'
import { X, ChevronLeft, ChevronRight } from '../icons'

export default function ImageGallery({ images, floorPlanUrl }) {
  const [lightbox, setLightbox] = useState(null)
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  const touchStartX = useRef(null)
  const allImages = [...(images || []), ...(floorPlanUrl && !isPdf(floorPlanUrl) ? [floorPlanUrl] : [])]

  if (!allImages.length && !floorPlanUrl) return null

  function next() {
    const nextIdx = (lightbox + 1) % allImages.length
    setLightbox(nextIdx)
  }

  function prevImg() {
    const prevIdx = (lightbox - 1 + allImages.length) % allImages.length
    setLightbox(prevIdx)
  }

  return (
    <>
      {/* Horizontal scroll gallery */}
      <div className="flex gap-2 overflow-x-auto gallery-scroll pb-2 -mx-4 px-4">
        {/* Regular images */}
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
            <div className="absolute top-2 right-2 bg-stone-950/60 text-stone-300 text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
              {i + 1}/{allImages.length + (floorPlanUrl && isPdf(floorPlanUrl) ? 1 : 0)}
            </div>
          </div>
        ))}

        {/* PDF floor plan thumbnail */}
        {floorPlanUrl && isPdf(floorPlanUrl) && (
          <PdfThumbnail
            url={floorPlanUrl}
            onClick={() => setShowFloorPlan(true)}
          />
        )}

        {/* Image floor plan */}
        {floorPlanUrl && !isPdf(floorPlanUrl) && (
          <div
            className="gallery-item relative shrink-0 w-64 h-44 md:w-80 md:h-56 rounded-xl overflow-hidden bg-stone-800 cursor-pointer active:scale-95 transition-transform"
            onClick={() => setShowFloorPlan(true)}
          >
            <img src={floorPlanUrl} alt="Floor Plan" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-stone-950/80 text-amber-400 text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
              🗺️ Floor Plan
            </div>
          </div>
        )}
      </div>

      {/* PDF Floor Plan Viewer */}
      {showFloorPlan && floorPlanUrl && (
        <PdfViewer url={floorPlanUrl} onClose={() => setShowFloorPlan(false)} />
      )}

      {/* Image Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/95 flex items-center justify-center animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button onClick={e => { e.stopPropagation(); prevImg() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-stone-800/80 rounded-full p-2 text-stone-300 active:scale-95 z-10">
            <ChevronLeft size={24} />
          </button>

          <img
            src={allImages[lightbox]}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              if (touchStartX.current === null) return
              const diff = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 40) { if (diff > 0) next(); else prevImg() }
              touchStartX.current = null
            }}
            style={{ maxHeight: '90dvh', maxWidth: '95vw' }}
          />

          <button onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-stone-800/80 rounded-full p-2 text-stone-300 active:scale-95 z-10">
            <ChevronRight size={24} />
          </button>

          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-stone-800/80 rounded-full p-2 text-stone-300">
            <X size={20} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-800/80 text-stone-300 text-xs px-3 py-1.5 rounded-full">
            {lightbox + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  )
}
