import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GripVertical, CheckCircle } from '../icons'
import { subscribeToItems, updateItem } from '../lib/db'
import { ITEM_CATEGORIES, ITEM_STATUS, ITEM_STATUS_LABELS, ITEM_STATUS_STYLE, REQUESTED_BY } from '../lib/items'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableItem({ item, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const price = parseFloat(item.price) || 0

  return (
    <div ref={setNodeRef} style={style}
      className="card flex items-center gap-3 p-3">
      <div className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center shrink-0">
        {item.rank}
      </div>
      <div
        {...attributes}
        {...listeners}
        className="p-1.5 text-stone-600 touch-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <GripVertical size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-stone-100 text-sm font-medium truncate">
          {item.name}
          {item.qty && item.qty !== '1' && <span className="text-stone-500 ml-1">×{item.qty}</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
          <span>{item.category}</span>
          {item.requestedBy && <span>· {item.requestedBy}</span>}
          {price > 0 && <span className="text-amber-400">${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>}
        </div>
      </div>
    </div>
  )
}

export default function ItemRankingPage() {
  const navigate = useNavigate()
  const [allItems, setAllItems] = useState([])
  const [rankedItems, setRankedItems] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Filters
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterPerson, setFilterPerson] = useState('All')

  useEffect(() => {
    const unsub = subscribeToItems((data) => {
      setAllItems(data)
    })
    return unsub
  }, [])

  // Build ranked list from all needed items
  useEffect(() => {
    const needed = allItems
      .filter(i => i.status === ITEM_STATUS.NEEDED)
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
    setRankedItems(needed)
  }, [allItems])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragStart(e) { setActiveId(e.active.id) }

  function handleDragEnd(e) {
    const { active, over } = e
    setActiveId(null)
    if (!over || active.id === over.id) return
    setRankedItems(items => {
      const oldIdx = items.findIndex(i => i.id === active.id)
      const newIdx = items.findIndex(i => i.id === over.id)
      return arrayMove(items, oldIdx, newIdx)
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    // Save ranks based on filtered or full list position
    const visibleIds = new Set(filtered.map(i => i.id))
    for (let i = 0; i < rankedItems.length; i++) {
      await updateItem(rankedItems[i].id, { rank: i + 1 })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Apply filters to display (filtering doesn't change rank order, just what's visible)
  const filtered = rankedItems.filter(item => {
    if (filterCategory !== 'All' && item.category !== filterCategory) return false
    if (filterPerson !== 'All' && item.requestedBy !== filterPerson) return false
    return true
  })

  const activeItem = activeId ? rankedItems.find(i => i.id === activeId) : null
  const isFiltered = filterCategory !== 'All' || filterPerson !== 'All'

  return (
    <div className="min-h-dvh bg-stone-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800"
           style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="px-4 pb-3 flex items-center gap-3">
          <button onClick={() => navigate('/items')} className="text-stone-400 active:text-stone-200">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-stone-100">Priority Ranking</h1>
            <p className="text-stone-500 text-xs">{rankedItems.length} needed items</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              saved ? 'bg-green-700 text-white' : 'btn-primary'
            }`}
          >
            {saved ? <><CheckCircle size={14} /> Saved</> : saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['All', ...ITEM_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterCategory === cat ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['All', ...REQUESTED_BY].map(p => (
              <button key={p} onClick={() => setFilterPerson(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterPerson === p ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Note when filtered */}
      {isFiltered && (
        <div className="px-4 pt-3">
          <p className="text-stone-500 text-xs bg-stone-800 rounded-xl px-3 py-2">
            Showing filtered view — drag to reorder within this view. Save applies ranks to all items.
          </p>
        </div>
      )}

      {/* Ranked list */}
      <div className="px-4 py-4 pb-24 space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-stone-500 text-sm">No needed items{isFiltered ? ' matching filters' : ''}.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filtered.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {filtered.map(item => (
                <SortableItem key={item.id} item={item} isDragging={activeId === item.id} />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeItem && <SortableItem item={activeItem} isDragging={false} />}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
