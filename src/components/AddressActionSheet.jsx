import React from 'react'
import { MapPin, Copy, X } from '../icons'

export default function AddressActionSheet({ address, onClose }) {
  if (!address) return null

  function openInMaps() {
    const encoded = encodeURIComponent(address.replace(/"/g, ""))
    // Try Apple Maps first (works on iOS), falls back to Google Maps
    window.open(`maps://?q=${encoded}`, '_blank') ||
      window.open(`https://maps.apple.com/?q=${encoded}`, '_blank')
    onClose()
  }

  function copyAddress() {
    navigator.clipboard.writeText(address)
      .catch(() => {
        // Fallback for older browsers
        const el = document.createElement('textarea')
        el.value = address
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-900 rounded-t-2xl border-t border-stone-800 animate-slide-up safe-bottom"
        onClick={e => e.stopPropagation()}
      >
        {/* Address label */}
        <div className="px-5 pt-4 pb-3 border-b border-stone-800">
          <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" />
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Address</p>
          <p className="text-stone-100 font-medium text-sm">{address}</p>
        </div>

        {/* Actions */}
        <div className="p-3 space-y-2">
          <button
            onClick={openInMaps}
            className="w-full flex items-center gap-4 px-4 py-3.5 bg-stone-800 rounded-xl active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-white" />
            </div>
            <span className="text-stone-100 font-medium">Open in Maps</span>
          </button>

          <button
            onClick={copyAddress}
            className="w-full flex items-center gap-4 px-4 py-3.5 bg-stone-800 rounded-xl active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 bg-stone-600 rounded-xl flex items-center justify-center shrink-0">
              <Copy size={18} className="text-white" />
            </div>
            <span className="text-stone-100 font-medium">Copy Address</span>
          </button>
        </div>

        {/* Cancel */}
        <div className="px-3 pb-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-stone-800 rounded-xl text-stone-300 font-semibold active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
