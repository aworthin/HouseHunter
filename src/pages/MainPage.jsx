import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Plus, Home, Trophy, Clock, BarChart2, Smartphone } from '../icons'
import { useHouses } from '../App'
import { updateRanks } from '../lib/db'
import SortableHouseCard from '../components/SortableHouseCard'
import HouseCard from '../components/HouseCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MainPage() {
  const navigate = useNavigate()
  const { toured, pending, loading } = useHouses()
  const [activeId, setActiveId] = useState(null)
  const [localToured, setLocalToured] = useState(null)

  const displayToured = localToured || toured

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
    if (!localToured) setLocalToured([...toured])
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) {
      setLocalToured(null)
      return
    }
    const current = localToured || toured
    const oldIndex = current.findIndex(h => h.id === active.id)
    const newIndex = current.findIndex(h => h.id === over.id)
    const reordered = arrayMove(current, oldIndex, newIndex)
    setLocalToured(reordered)
    updateRanks(reordered.map(h => h.id)).then(() => setLocalToured(null))
  }

  const activeHouse = activeId ? (localToured || toured).find(h => h.id === activeId) : null

  if (loading) return (
    <div className="min-h-dvh bg-stone-950 flex items-center justify-center">
      <LoadingSpinner message="Loading your houses..." />
    </div>
  )

  return (
    <div className="min-h-dvh bg-stone-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="px-4 pt-safe pt-4 pb-3 flex items-center justify-between"
             style={{ paddingTop: `max(1rem, env(safe-area-inset-top))` }}>
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-100">HomeQuest</h1>
            <p className="text-stone-500 text-xs mt-0.5">
              {toured.length} toured · {pending.length} pending
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/shortcut-setup')}
              className="bg-stone-800 text-stone-300 p-2.5 rounded-xl border border-stone-700 active:scale-95 transition-transform"
              title="iOS Shortcut Setup"
            >
              <Smartphone size={18} />
            </button>
          {toured.length > 1 && (
              <button
                onClick={() => navigate('/ranking')}
                className="bg-stone-800 text-stone-300 p-2.5 rounded-xl border border-stone-700 active:scale-95 transition-transform"
                title="Adjust Rankings"
              >
                <BarChart2 size={18} />
              </button>
            )}
            <button
              onClick={() => navigate('/add')}
              className="btn-primary flex items-center gap-2 py-2.5 px-4"
            >
              <Plus size={18} />
              <span>Add House</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-8 pt-4">
        {/* Toured List */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" />
            <h2 className="section-title">Ranked Houses</h2>
            {displayToured.length > 0 && (
              <span className="text-stone-600 text-sm">· drag to reorder</span>
            )}
          </div>

          {displayToured.length === 0 ? (
            <div className="card p-8 text-center">
              <Trophy size={32} className="text-stone-700 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No toured houses yet.</p>
              <p className="text-stone-600 text-xs mt-1">Tour a house to start ranking.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayToured.map(h => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {displayToured.map((house, i) => (
                    <SortableHouseCard key={house.id} house={house} rank={i + 1} />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeHouse && (
                  <div className="opacity-90 shadow-2xl rotate-1">
                    <HouseCard house={activeHouse} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </section>

        {/* Pending List */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-stone-500" />
            <h2 className="section-title text-stone-400">To Be Toured</h2>
          </div>

          {pending.length === 0 ? (
            <div className="card p-8 text-center">
              <Home size={32} className="text-stone-700 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No houses queued.</p>
              <button
                onClick={() => navigate('/add')}
                className="text-amber-500 text-sm mt-2 underline underline-offset-2"
              >
                Add your first house
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map(house => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
