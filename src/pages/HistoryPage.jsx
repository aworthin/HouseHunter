import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, History, Plus, Eye, ClipboardList, ThumbsDown, TrendingDown, Trash2, BarChart2, User, RefreshCw } from '../icons'
import { subscribeToHistory, STATUS_LABELS } from '../lib/db'
import { ulidToDate } from '../lib/ulid'
import { setLastSeenUlid, getLastSeenUlid } from '../lib/userPrefs'
import { useHouses } from '../App'

const EVENT_CONFIG = {
  added: { label: 'Added', icon: Plus, color: 'text-green-400', bg: 'bg-green-950/40 border-green-900' },
  status_changed: { label: 'Status Changed', icon: History, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-900' },
  toured: { label: 'Toured', icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-900' },
  deleted: { label: 'Deleted', icon: Trash2, color: 'text-red-400', bg: 'bg-red-950/40 border-red-900' },
  ranked: { label: 'Rankings Updated', icon: BarChart2, color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-900' },
  refreshed: { label: 'Refreshed from Zillow', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-900' },
}

const STATUS_COLORS = {
  [STATUS_LABELS.new]: 'text-stone-400',
  new: 'text-stone-400',
  reviewed: 'text-blue-400',
  toured: 'text-amber-400',
  rejected: 'text-red-400',
  sold: 'text-red-300',
}

function timeAgo(date) {
  if (!date) return ''
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayLabel(date) {
  if (!date) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function EventDescription({ item }) {
  if (item.event === 'status_changed') {
    const from = item.fromStatus ? <span className={`font-medium ${STATUS_COLORS[item.fromStatus] || 'text-stone-400'}`}>{STATUS_LABELS[item.fromStatus] || item.fromStatus}</span> : null
    const to = item.toStatus ? <span className={`font-medium ${STATUS_COLORS[item.toStatus] || 'text-stone-400'}`}>{STATUS_LABELS[item.toStatus] || item.toStatus}</span> : null
    return <span>{from && <>{from} → </>}{to}</span>
  }
  if (item.event === 'added') return <span className="text-green-400 font-medium">Added to list</span>
  if (item.event === 'deleted') return <span className="text-red-400 font-medium">Deleted</span>
  if (item.event === 'ranked') return <span className="text-stone-300">{item.note || 'Rankings updated'}</span>
  if (item.event === 'refreshed') return <span className="text-blue-400 font-medium">Refreshed from Zillow</span>
  return <span className="text-stone-400">{item.note || item.event}</span>
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { latestHistoryId, setLastSeenUlidState } = useHouses()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  // Capture the last seen ULID at mount time BEFORE we update it
  const [seenUlidAtMount] = useState(() => getLastSeenUlid())

  useEffect(() => {
    const unsub = subscribeToHistory((data) => {
      setItems(data)
      setLoading(false)
      // Mark all as seen after we've loaded and displayed
      if (data.length > 0) {
        setLastSeenUlid(data[0].id)
        setLastSeenUlidState?.(data[0].id)
      }
    })
    return unsub
  }, [])

  // Group by day
  const grouped = []
  let currentDay = null
  for (const item of items) {
    const date = item.id ? ulidToDate(item.id) : null
    const day = date ? dayLabel(date) : 'Unknown'
    if (day !== currentDay) {
      grouped.push({ type: 'day', label: day })
      currentDay = day
    }
    grouped.push({ type: 'item', item, date })
  }

  return (
    <div className="min-h-dvh bg-stone-950">
      <div className="page-header" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-semibold text-stone-100 flex-1">Activity History</h1>
      </div>

      <div className="pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <History size={40} className="text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500">No activity yet.</p>
            <p className="text-stone-600 text-sm mt-1">Actions like adding or updating houses will appear here.</p>
          </div>
        ) : (
          <>
          {(() => {
              const newCount = items.filter(item => seenUlidAtMount && item.id > seenUlidAtMount).length
              if (!newCount) return null
              return (
                <div className="px-4 pt-4">
                  <div className="card p-3 mb-1 border-amber-700/50 bg-amber-950/20 flex items-center gap-2">
                    <span className="bg-amber-500 text-stone-950 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">{newCount}</span>
                    <p className="text-amber-400 text-sm">{newCount === 1 ? '1 new item' : `${newCount} new items`} since your last visit</p>
                  </div>
                </div>
              )
            })()}
          <div className="px-4 pt-2 space-y-1">
            {grouped.map((entry, i) => {
              if (entry.type === 'day') {
                return (
                  <div key={`day-${i}`} className="pt-4 pb-1">
                    <p className="text-stone-600 text-xs font-medium uppercase tracking-wider">{entry.label}</p>
                  </div>
                )
              }
              const { item, date } = entry
              const cfg = EVENT_CONFIG[item.event] || EVENT_CONFIG.added
              const Icon = cfg.icon
              const isNew = seenUlidAtMount && item.id > seenUlidAtMount

              return (
                <div
                  key={item.id}
                  className={`p-3 flex items-start gap-3 animate-fade-in rounded-2xl border ${cfg.bg} ${
                isNew ? 'border-l-4 border-l-amber-500' : ''
              }`}
                  onClick={() => item.houseId && navigate(`/house/${item.houseId}`)}
                  style={{ cursor: item.houseId ? 'pointer' : 'default' }}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-stone-900`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.address && (
                      <p className="text-stone-200 text-sm font-medium truncate">{item.address}</p>
                    )}
                    <p className="text-stone-400 text-xs mt-0.5">
                      <EventDescription item={item} />
                    </p>
                    {item.note && item.event !== 'ranked' && item.event !== 'refreshed' &&
                      !(item.event === 'toured' && item.note === 'Tour started') && (
                      <p className="text-stone-600 text-xs mt-0.5 italic">{item.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <User size={10} className="text-stone-600" />
                      <p className="text-stone-600 text-xs">{item.userName}</p>
                      <span className="text-stone-700">·</span>
                      <p className="text-stone-600 text-xs">{timeAgo(date)}</p>
                      {isNew && <span className="bg-amber-500 text-stone-950 text-xs font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
