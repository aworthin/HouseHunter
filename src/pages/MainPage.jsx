import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import {
  Plus, Trophy, Clock, BarChart2, Smartphone, History,
  Eye, ThumbsDown, TrendingDown, RefreshCw, Home, Copy
} from '../icons'
import { useHouses } from '../App'
import { updateRanks } from '../lib/db'
import { setLastSeenUlid } from '../lib/userPrefs'
import SortableHouseCard from '../components/SortableHouseCard'
import HouseCard from '../components/HouseCard'
import LoadingSpinner from '../components/LoadingSpinner'

function SectionHeader({ icon: Icon, label, count, color = 'text-stone-400', defaultOpen = true, houses = [], children }) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  function exportAddresses(e) {
    e.stopPropagation()
    const addresses = houses
      .filter(h => h.address)
      .map(h => h.address)
      .join('\n')
    if (!addresses) return
    navigator.clipboard.writeText(addresses)
      .catch(() => {
        const el = document.createElement('textarea')
        el.value = addresses
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 flex-1 group"
        >
          <Icon size={16} className={color} />
          <h2 className={`font-display text-lg font-semibold ${color === 'text-stone-400' ? 'text-stone-100' : color}`}>
            {label}
          </h2>
          {count > 0 && (
            <span className="text-xs text-stone-300 bg-stone-700 px-2 py-0.5 rounded-full ml-1">{count}</span>
          )}
          <span className="text-stone-600 text-xs ml-auto">{open ? '▲' : '▼'}</span>
        </button>
        {count > 0 && (
          <button
            onClick={exportAddresses}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all active:scale-95 shrink-0 ${
              copied
                ? 'bg-green-900/50 text-green-400 border-green-800'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            <Copy size={11} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
      {open && children}
    </section>
  )
}

export default function MainPage() {
  const navigate = useNavigate()
  const { ranked, reviewed, newHouses, rejected, sold, loading, checkStatus, hasUnreadHistory, latestHistoryId } = useHouses()
  const [activeId, setActiveId] = useState(null)
  const [localRanked, setLocalRanked] = useState(null)

  const displayRanked = localRanked || ranked

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
    if (!localRanked) setLocalRanked([...ranked])
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) { setLocalRanked(null); return }
    const current = localRanked || ranked
    const oldIndex = current.findIndex(h => h.id === active.id)
    const newIndex = current.findIndex(h => h.id === over.id)
    const reordered = arrayMove(current, oldIndex, newIndex)
    setLocalRanked(reordered)
    updateRanks(reordered.map(h => h.id)).then(() => setLocalRanked(null))
  }

  const activeHouse = activeId ? (localRanked || ranked).find(h => h.id === activeId) : null

  function handleHistoryClick() {
    if (latestHistoryId) setLastSeenUlid(latestHistoryId)
    navigate('/history')
  }

  if (loading) return (
    <div className="min-h-dvh bg-stone-950 flex items-center justify-center">
      <LoadingSpinner message="Loading your houses..." />
    </div>
  )

  return (
    <div className="min-h-dvh bg-stone-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="px-4 pb-3 flex items-center justify-between"
             style={{ paddingTop: `max(1rem, env(safe-area-inset-top))` }}>
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-100">HouseHunter</h1>
            {checkStatus === 'checking' && (
              <p className="text-amber-500 text-xs mt-0.5 flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Checking listings for sold status...
              </p>
            )}
            {checkStatus === 'done' && (
              <p className="text-green-500 text-xs mt-0.5">✓ All listings current</p>
            )}
            {!checkStatus && (
              <p className="text-stone-500 text-xs mt-0.5">
                {ranked.length} ranked · {reviewed.length} to tour · {newHouses.length} new
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* History button with badge */}
            <button
              onClick={handleHistoryClick}
              className="relative bg-stone-800 text-stone-300 p-2.5 rounded-xl border border-stone-700 active:scale-95 transition-transform"
            >
              <History size={18} />
              {hasUnreadHistory && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-stone-950" />
              )}
            </button>
            {ranked.length > 1 && (
              <button
                onClick={() => navigate('/ranking')}
                className="bg-stone-800 text-stone-300 p-2.5 rounded-xl border border-stone-700 active:scale-95 transition-transform"
              >
                <BarChart2 size={18} />
              </button>
            )}
            <button
              onClick={() => navigate('/shortcut-setup')}
              className="bg-stone-800 text-stone-300 p-2.5 rounded-xl border border-stone-700 active:scale-95 transition-transform"
            >
              <Smartphone size={18} />
            </button>
            <button
              onClick={() => navigate('/add')}
              className="btn-primary flex items-center gap-2 py-2.5 px-4"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-8 pt-4">
        {/* Ranked / Toured */}
        <SectionHeader icon={Trophy} label="Ranked Houses" count={displayRanked.length} color="text-amber-500" houses={displayRanked}>
          {displayRanked.length === 0 ? (
            <div className="card p-8 text-center">
              <Trophy size={32} className="text-stone-700 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No toured houses yet.</p>
              <p className="text-stone-600 text-xs mt-1">Tour a house to start ranking.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter}
              onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={displayRanked.map(h => h.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {displayRanked.map((house, i) => (
                    <SortableHouseCard key={house.id} house={house} rank={i + 1} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeHouse && <div className="opacity-90 shadow-2xl rotate-1"><HouseCard house={activeHouse} /></div>}
              </DragOverlay>
            </DndContext>
          )}
        </SectionHeader>

        {/* To Be Toured (Reviewed) */}
        <SectionHeader icon={Clock} label="To Be Toured" count={reviewed.length} color="text-blue-400" houses={reviewed}>
          {reviewed.length === 0 ? (
            <div className="card p-6 text-center">
              <Clock size={28} className="text-stone-700 mx-auto mb-2" />
              <p className="text-stone-500 text-sm">No houses scheduled for tours yet.</p>
              <p className="text-stone-600 text-xs mt-1">Mark a house as Reviewed to add it here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviewed.map(house => <HouseCard key={house.id} house={house} />)}
            </div>
          )}
        </SectionHeader>

        {/* To Be Reviewed (New) */}
        <SectionHeader icon={Eye} label="To Be Reviewed" count={newHouses.length} color="text-stone-400" houses={newHouses}>
          {newHouses.length === 0 ? (
            <div className="card p-6 text-center">
              <Home size={28} className="text-stone-700 mx-auto mb-2" />
              <p className="text-stone-500 text-sm">No new houses.</p>
              <button onClick={() => navigate('/add')} className="text-amber-500 text-sm mt-2 underline underline-offset-2">
                Add your first house
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {newHouses.map(house => <HouseCard key={house.id} house={house} />)}
            </div>
          )}
        </SectionHeader>

        {/* Rejected */}
        <SectionHeader icon={ThumbsDown} label="Rejected" count={rejected.length} color="text-stone-600" defaultOpen={false} houses={rejected}>
          {rejected.length === 0 ? (
            <p className="text-stone-600 text-sm">No rejected houses.</p>
          ) : (
            <div className="space-y-2">
              {rejected.map(house => <HouseCard key={house.id} house={house} />)}
            </div>
          )}
        </SectionHeader>

        {/* Sold */}
        <SectionHeader icon={TrendingDown} label="Sold / Off Market" count={sold.length} color="text-red-500" defaultOpen={false} houses={sold}>
          {sold.length === 0 ? (
            <p className="text-stone-600 text-sm">No sold houses detected.</p>
          ) : (
            <div className="space-y-2">
              {sold.map(house => <HouseCard key={house.id} house={house} />)}
            </div>
          )}
        </SectionHeader>
      </div>
    </div>
  )
}
