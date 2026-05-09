import React, { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink } from '../icons'
import { renderPdfPage } from '../lib/pdfRenderer'

// Single page canvas renderer
function PdfPage({ url, pageNum, scale = 1.5 }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!canvasRef.current) return
    setLoading(true)
    setError(false)
    renderPdfPage(url, canvasRef.current, pageNum, scale)
      .then(() => setLoading(false))
      .catch(() => { setError(true); setLoading(false) })
  }, [url, pageNum, scale])

  if (error) return null
  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900 rounded-lg">
          <div className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  )
}

// Full-screen PDF viewer
export function PdfViewer({ url, onClose }) {
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [useFallback, setUseFallback] = useState(false)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    setLoading(true)
    renderPdfPage(url, canvasRef.current, currentPage, 1.8)
      .then(({ pageCount: pc }) => {
        setPageCount(pc)
        setLoading(false)
      })
      .catch(() => {
        setUseFallback(true)
        setLoading(false)
      })
  }, [url, currentPage])

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-800 shrink-0"
           style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="text-stone-400 active:text-stone-200">
          <X size={22} />
        </button>
        <p className="text-stone-300 font-medium text-sm flex-1">
          Floor Plan
          {!useFallback && pageCount > 1 && (
            <span className="text-stone-500 ml-2">· Page {currentPage} of {pageCount}</span>
          )}
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="bg-stone-800 text-stone-300 text-xs px-3 py-1.5 rounded-lg border border-stone-700 active:scale-95 transition-transform flex items-center gap-1.5">
          <ExternalLink size={12} />
          Open
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {useFallback ? (
          // Google Docs iframe fallback
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
            className="w-full h-full border-0"
            title="Floor Plan"
          />
        ) : (
          <div className="p-4">
            <div className="relative">
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full rounded-xl"
                style={{ display: loading ? 'none' : 'block' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Page nav */}
      {!useFallback && pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 border-t border-stone-800 shrink-0 safe-bottom">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary px-4 py-2 disabled:opacity-30 flex items-center gap-1">
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-stone-500 text-sm">{currentPage} / {pageCount}</span>
          <button onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
            disabled={currentPage === pageCount}
            className="btn-secondary px-4 py-2 disabled:opacity-30 flex items-center gap-1">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// Thumbnail component for gallery
export function PdfThumbnail({ url, onClick, label }) {
  const canvasRef = useRef(null)
  const [rendered, setRendered] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    renderPdfPage(url, canvasRef.current, 1, 0.3)
      .then(() => setRendered(true))
      .catch(() => setFailed(true))
  }, [url])

  return (
    <div
      onClick={onClick}
      className="gallery-item relative shrink-0 w-64 h-44 md:w-80 md:h-56 rounded-xl overflow-hidden bg-stone-800 cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
    >
      {!failed ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ display: rendered ? 'block' : 'none' }}
        />
      ) : (
        // Fallback icon when PDF can't be rendered as thumbnail
        <div className="flex flex-col items-center gap-2 text-stone-500">
          <span className="text-4xl">📄</span>
          <span className="text-xs">Floor Plan PDF</span>
        </div>
      )}
      {!rendered && !failed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      {/* Label */}
      <div className="absolute bottom-2 left-2 bg-stone-950/80 text-amber-400 text-xs px-2 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
        📄 {label || 'Floor Plan'}
      </div>
    </div>
  )
}
