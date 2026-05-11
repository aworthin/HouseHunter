import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, GripVertical, Trophy, CheckCircle } from '../icons'
import { useHouses } from '../App'
import { updateRanks } from '../lib/db'

function RankItem({ house, rank, isDragging, dragHandleProps, isHighlighted }) {
  const img = house.imageUrls?.[0]
  return (
    <div className={`card flex items-center gap-3 p-3 transition-all ${
      isDragging ? 'opacity-40' : ''
    } ${isHighlighted ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
      {/* Rank number */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
        rank === 1 ? 'bg-amber-500 text-stone-950' :
        rank === 2 ? 'bg-stone-400 text-stone-950' :
        rank === 3 ? 'bg-amber-800 text-stone-200' :
        'bg-stone-800 text-stone-400'
      }`}>
        {rank}
      </div>

      {/* Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-800 shrink-0">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy size={14} className="text-stone-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-stone-200 text-sm font-medium truncate">{house.address || 'Unknown address'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {house.price && <span className="text-amber-400 text-xs">{house.price}</span>}
          {house.tourOverallRating > 0 && (
            <span className="text-stone-500 text-xs">{'★'.repeat(house.tourOverallRating)}</span>
          )}
        </div>
      </div>

      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="drag-handle p-2 text-stone-600 active:text-stone-400"
      >
        <GripVertical size={20} />
      </div>
    </div>
  )
}

function SortableRankItem({ house, rank, isHighlighted }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: house.id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined }
  return (
    <div ref={setNodeRef} style={style}>
      <RankItem
        house={house}
        rank={rank}
        isDragging={isDragging}
        isHighlighted={isHighlighted}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default function RankingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const highlightId = location.state?.highlightId
  const { ranked: toured } = useHouses()

  const [list, setList] = useState(toured)
  const [activeId, setActiveId] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setList(toured) }, [toured.length])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = list.findIndex(h => h.id === active.id)
    const newIndex = list.findIndex(h => h.id === over.id)
    setList(arrayMove(list, oldIndex, newIndex))
    setSaved(false)
  }

  async function handleSave() {
    await updateRanks(list.map(h => h.id))
    setSaved(true)
    setTimeout(() => navigate('/'), 800)
  }

  const activeHouse = activeId ? list.find(h => h.id === activeId) : null

  return (
    <div className="min-h-dvh bg-stone-950">
      <div className="page-header" style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-stone-100">Rank Houses</h1>
          <p className="text-stone-500 text-xs">Drag to reorder · #1 is your favorite</p>
        </div>
      </div>

      <div className="px-4 py-4 pb-32">
        {highlightId && (
          <div className="card p-3 border-amber-500/40 bg-amber-500/5 mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-amber-400 text-sm">New house added — drag it to the right spot</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={list.map(h => h.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {list.map((house, i) => (
                <SortableRankItem
                  key={house.id}
                  house={house}
                  rank={i + 1}
                  isHighlighted={house.id === highlightId}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeHouse && (
              <div className="opacity-95 shadow-2xl rotate-1 scale-105">
                <RankItem house={activeHouse} rank={list.findIndex(h => h.id === activeHouse.id) + 1} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 px-4 pt-3 safe-bottom">
        <button
          onClick={handleSave}
          className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
            saved ? 'bg-green-800 text-green-200' : 'btn-primary'
          }`}
        >
          {saved ? (
            <><CheckCircle size={18} /> Rankings Saved!</>
          ) : (
            <><Trophy size={18} /> Confirm Rankings</>
          )}
        </button>
      </div>
    </div>
  )
}
