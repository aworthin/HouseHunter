import React, { useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Image } from '../icons'

function isLikelyPdf(url) {
  if (!url) return false
  return url.toLowerCase().includes('.pdf') ||
    url.toLowerCase().includes('application/pdf') ||
    url.toLowerCase().includes('drive.google.com') ||
    url.toLowerCase().includes('dropbox.com')
}

function FloorPlanViewer({ url, onClose }) {
  const isPdf = isLikelyPdf(url)
  const viewerUrl = isPdf
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : url
  const [loadError, setLoadError] = useState(false)

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/98 flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-800"
           style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="text-stone-400 active:text-stone-200">
          <X size={22} />
        </button>
        <p className="text-stone-300 font-medium text-sm flex-1">Floor Plan</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-stone-800 text-stone-300 text-xs px-3 py-1.5 rounded-lg border border-stone-700 active:scale-95 transition-transform"
          onClick={onClose}
        >
          Open in Browser
        </a>
      </div>
      <div className="flex-1 relative">
        {!loadError ? (
          isPdf ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              onError={() => setLoadError(true)}
              title="Floor Plan"
            />
          ) : (
            <img
              src={url}
              alt="Floor Plan"
              className="w-full h-full object-contain"
              onError={() => setLoadError(true)}
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            <p className="text-stone-400 text-center">Could not display floor plan inline.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-6 py-3"
            >
              Open Floor Plan in Browser
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ImageGallery({ images, floorPlanUrl }) {
  const [lightbox, setLightbox] = useState(null)
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  const touchStartX = useRef(null)
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

  function prevImg() {
    const prevIdx = (lightbox - 1 + allImages.length) % allImages.length
    if (isFloorPlanIndex(prevIdx)) { setLightbox(null); setShowFloorPlan(true) }
    else setLightbox(prevIdx)
  }
  const isFloorPlanIndex = (i) => i === allImages.length - 1 && floorPlanUrl && isLikelyPdf(floorPlanUrl)
  const next = () => setLightbox(l => (l + 1) % allImages.length)

  return (
    <>
      {/* Horizontal scroll gallery */}
      <div className="flex gap-2 overflow-x-auto gallery-scroll pb-2 -mx-4 px-4">
        {allImages.map((url, i) => (
          <div
            key={i}
            className="gallery-item relative shrink-0 w-64 h-44 md:w-80 md:h-56 rounded-xl overflow-hidden bg-stone-800 cursor-pointer active:scale-95 transition-transform"
            onClick={() => {
              if (i === allImages.length - 1 && floorPlanUrl && isLikelyPdf(floorPlanUrl)) {
                setShowFloorPlan(true)
              } else {
                setLightbox(i)
              }
            }}
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
              <div className="absolute bottom-2 left-2 bg-stone-950/80 text-amber-400 text-xs px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
                {isLikelyPdf(floorPlanUrl) ? '📄' : '🗺️'} Floor Plan
              </div>
            )}
            <div className="absolute top-2 right-2 bg-stone-950/60 text-stone-300 text-xs px-1.5 py-0.5 rounded backdrop-blur-sm">
              {i + 1}/{allImages.length}
            </div>
          </div>
        ))}
      </div>

      {/* Floor Plan Viewer */}
      {showFloorPlan && floorPlanUrl && (
        <FloorPlanViewer url={floorPlanUrl} onClose={() => setShowFloorPlan(false)} />
      )}

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
            onClick={e => { e.stopPropagation(); prevImg() }}
          >
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
              if (Math.abs(diff) > 40) {
                if (diff > 0) next()
                else prev()
              }
              touchStartX.current = null
            }}
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
