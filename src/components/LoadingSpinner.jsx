import React from 'react'

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-8 h-8 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-stone-500 text-sm">{message}</p>
    </div>
  )
}
