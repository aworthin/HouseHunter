import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ExternalLink } from '../icons'

const APP_URL = 'https://bw-house-hunter.netlify.app'

const steps = [
  {
    number: 1,
    title: 'Open the Shortcuts app',
    detail: 'It comes pre-installed on every iPhone and iPad. Search for it in Spotlight if you can\'t find it.',
    tip: null,
  },
  {
    number: 2,
    title: 'Tap the + button to create a new shortcut',
    detail: 'It\'s in the top-right corner of the Shortcuts app.',
    tip: null,
  },
  {
    number: 3,
    title: 'Tap "Add Action"',
    detail: 'Search for "URL" and select the URL action. This will hold the Zillow link.',
    tip: null,
  },
  {
    number: 4,
    title: 'Add a second action: "Open URLs"',
    detail: 'Search for "Open URLs" and add it. This opens the URL in Safari.',
    tip: null,
  },
  {
    number: 5,
    title: 'Set the URL to this formula',
    detail: null,
    code: `${APP_URL}/add?zillow=`,
    codeAfter: '[Shortcut Input]',
    tip: 'Tap the URL field, type the address above, then tap the blue variable button and select "Shortcut Input" to append the Zillow URL automatically.',
  },
  {
    number: 6,
    title: 'Name the shortcut "Add to HomeQuest"',
    detail: 'Tap the shortcut name at the top to rename it.',
    tip: null,
  },
  {
    number: 7,
    title: 'Enable "Show in Share Sheet"',
    detail: 'Tap the info (ⓘ) button → turn on "Show in Share Sheet". This makes it appear when you tap Share in Zillow.',
    tip: 'Also set "Receive" to "URLs" so it only appears when sharing links.',
  },
]

export default function ShortcutSetupPage() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState({})

  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }))
  const allDone = steps.every((_, i) => checked[i])

  return (
    <div className="min-h-dvh bg-stone-950">
      <div className="page-header" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-stone-100">iOS Shortcut Setup</h1>
          <p className="text-stone-500 text-xs">Add houses from Zillow in one tap</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-24">

        {/* Intro */}
        <div className="card p-4 border-amber-500/30 bg-amber-500/5">
          <p className="text-amber-400 font-medium text-sm mb-1">How it works</p>
          <p className="text-stone-400 text-sm leading-relaxed">
            Once set up, you can be browsing a listing in the Zillow app or Safari, tap the
            Share button, and tap <span className="text-stone-200 font-medium">"Add to HomeQuest"</span>.
            The app will open and automatically pull the listing details.
          </p>
        </div>

        {/* Steps */}
        {steps.map((step, i) => (
          <div
            key={i}
            className={`card p-4 transition-all ${checked[i] ? 'opacity-60' : ''}`}
            onClick={() => toggle(i)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-all ${
                checked[i] ? 'bg-green-600 text-white' : 'bg-stone-700 text-stone-300'
              }`}>
                {checked[i] ? '✓' : step.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm mb-1 ${checked[i] ? 'line-through text-stone-500' : 'text-stone-100'}`}>
                  {step.title}
                </p>
                {step.detail && (
                  <p className="text-stone-500 text-xs leading-relaxed">{step.detail}</p>
                )}
                {step.code && (
                  <div className="mt-2 bg-stone-800 rounded-lg p-3 border border-stone-700">
                    <p className="text-xs text-stone-500 mb-1">URL field value:</p>
                    <p className="font-mono text-xs text-amber-400 break-all">{step.code}</p>
                    <p className="font-mono text-xs text-blue-400">[Shortcut Input]</p>
                  </div>
                )}
                {step.tip && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <span className="text-amber-500 text-xs mt-0.5">💡</span>
                    <p className="text-stone-500 text-xs leading-relaxed italic">{step.tip}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Done state */}
        {allDone && (
          <div className="card p-5 border-green-800 bg-green-950/30 text-center animate-slide-up">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-green-400 font-semibold text-base">Shortcut is ready!</p>
            <p className="text-stone-500 text-sm mt-1">
              Open Zillow, find a listing, tap Share, then tap "Add to HomeQuest"
            </p>
          </div>
        )}

        {/* Test link */}
        <div className="card p-4">
          <p className="text-stone-400 text-sm font-medium mb-2">Test it manually</p>
          <p className="text-stone-500 text-xs mb-3">
            You can also manually add a house by pasting a Zillow URL into the Add House screen — the shortcut just automates this.
          </p>
          <button
            onClick={() => navigate('/add')}
            className="btn-secondary w-full text-sm"
          >
            Open Add House Screen
          </button>
        </div>

        {/* Zillow app note */}
        <div className="card p-4">
          <p className="text-stone-400 text-sm font-medium mb-1">Using the Zillow app?</p>
          <p className="text-stone-500 text-xs leading-relaxed">
            Works the same way. In the Zillow app, open a listing, tap the Share icon (usually top-right),
            and you'll see "Add to HomeQuest" in your share sheet alongside AirDrop, Messages, etc.
          </p>
        </div>

      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 px-4 pt-3 safe-bottom">
        <button onClick={() => navigate('/')} className="btn-primary w-full py-3">
          Back to My Houses
        </button>
      </div>
    </div>
  )
}
