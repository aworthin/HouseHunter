import React from 'react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-stone-950/80 animate-fade-in">
      <div className="card w-full max-w-sm p-6 animate-slide-up">
        <h3 className="font-display font-semibold text-stone-100 text-lg mb-2">{title}</h3>
        <p className="text-stone-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
