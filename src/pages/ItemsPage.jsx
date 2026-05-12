import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, ExternalLink, DollarSign, Package, CheckCircle, BarChart2 } from '../icons'
import { useNavigate } from 'react-router-dom'
import { subscribeToItems, addItem, updateItem, deleteItem } from '../lib/db'
import {
  ITEM_CATEGORIES, ITEM_STATUS, ITEM_STATUS_LABELS,
  ITEM_STATUS_ORDER, ITEM_STATUS_STYLE, REQUESTED_BY
} from '../lib/items'
import ConfirmDialog from '../components/ConfirmDialog'

// ─── Item Form Sheet ──────────────────────────────────────────────────
function ItemFormSheet({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    brand: item?.brand || '',
    model: item?.model || '',
    store: item?.store || '',
    price: item?.price || '',
    link: item?.link || '',
    notes: item?.notes || '',
    category: item?.category || ITEM_CATEGORIES[0],
    requestedBy: item?.requestedBy || '',
    status: item?.status || ITEM_STATUS.NEEDED,
    qty: item?.qty || '1',
  })
  const [saving, setSaving] = useState(false)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/80 animate-fade-in">
      <div className="w-full max-w-lg bg-stone-900 rounded-t-2xl border-t border-stone-800 max-h-[92vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="font-display text-lg font-semibold text-stone-100">
            {item ? 'Edit Item' : 'Add Item'}
          </h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary py-2 px-4 text-sm disabled:opacity-40">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 safe-bottom">
          <div>
            <label className="label">Name *</label>
            <input className="input" placeholder="Item name" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {ITEM_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => set('category', cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                    form.category === cat ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ITEM_STATUS_LABELS).map(([val, label]) => (
                <button key={val} onClick={() => set('status', val)}
                  className={`py-2 rounded-xl text-xs font-medium transition-all active:scale-95 border ${
                    form.status === val ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Requested By */}
          <div>
            <label className="label">Requested By</label>
            <div className="flex gap-2">
              {['', ...REQUESTED_BY].map(person => (
                <button key={person} onClick={() => set('requestedBy', person)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                    form.requestedBy === person
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}>
                  {person || 'Anyone'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Brand</label>
              <input className="input" placeholder="e.g. Samsung" value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="input" placeholder="e.g. RF28T" value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Store</label>
              <input className="input" placeholder="e.g. Home Depot" value={form.store} onChange={e => set('store', e.target.value)} />
            </div>
            <div>
              <label className="label">Price</label>
              <input className="input" placeholder="$0.00" value={form.price}
                onChange={e => set('price', e.target.value)} inputMode="decimal" />
            </div>
          </div>

          <div>
            <label className="label">Qty</label>
            <input className="input" placeholder="1" value={form.qty}
              onChange={e => set('qty', e.target.value)} inputMode="numeric" />
          </div>

          <div>
            <label className="label">Link</label>
            <input className="input" placeholder="https://..." value={form.link}
              onChange={e => set('link', e.target.value)} type="url" inputMode="url" />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} placeholder="Notes..."
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Item Card ────────────────────────────────────────────────────────
function ItemCard({ item, onEdit, onDelete, onStatusChange }) {
  const price = parseFloat(item.price) || 0

  return (
    <div className={`card p-3 flex items-start gap-3 ${item.status === ITEM_STATUS.NOT_NEEDED ? 'opacity-50' : ''}`}>
      {item.rank && item.status === ITEM_STATUS.NEEDED && (
        <div className="w-7 h-7 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center shrink-0">{item.rank}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-stone-100 font-medium text-sm">{item.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${ITEM_STATUS_STYLE[item.status]}`}>
            {ITEM_STATUS_LABELS[item.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500 mb-1">
          {item.brand && <span>{item.brand}{item.model ? ` · ${item.model}` : ''}</span>}
          {item.store && <span>📍 {item.store}</span>}
          {item.requestedBy && <span>👤 {item.requestedBy}</span>}
          {item.qty && item.qty !== '1' && <span className="text-stone-400">×{item.qty}</span>}
          {price > 0 && <span className="text-amber-400 font-medium">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
        </div>
        {item.notes && <p className="text-stone-600 text-xs italic line-clamp-1">{item.notes}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer"
            className="p-1.5 text-stone-500 active:text-amber-400 transition-colors">
            <ExternalLink size={15} />
          </a>
        )}
        <button onClick={() => onEdit(item)} className="p-1.5 text-stone-500 active:text-amber-400 transition-colors">
          <Edit2 size={15} />
        </button>
        <button onClick={() => onDelete(item)} className="p-1.5 text-stone-500 active:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Main ItemsPage ───────────────────────────────────────────────────
export default function ItemsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showNotNeeded, setShowNotNeeded] = useState(false)

  useEffect(() => {
    const unsub = subscribeToItems((data) => { setItems(data); setLoading(false) })
    return unsub
  }, [])

  async function handleSave(form) {
    if (editingItem) await updateItem(editingItem.id, form)
    else await addItem(form)
    setEditingItem(null)
  }

  async function handleDelete() {
    if (confirmDelete) await deleteItem(confirmDelete.id)
    setConfirmDelete(null)
  }

  function openEdit(item) { setEditingItem(item); setShowForm(true) }
  function openAdd() { setEditingItem(null); setShowForm(true) }

  // Group by category
  const activeItems = items.filter(i => i.status !== ITEM_STATUS.NOT_NEEDED)
  const notNeededItems = items.filter(i => i.status === ITEM_STATUS.NOT_NEEDED)

  const grouped = ITEM_CATEGORIES.map(cat => {
    const catItems = activeItems
      .filter(i => i.category === cat)
      .sort((a, b) => {
        const statusOrder = ITEM_STATUS_ORDER.indexOf(a.status) - ITEM_STATUS_ORDER.indexOf(b.status)
        if (statusOrder !== 0) return statusOrder
        return (a.name || '').localeCompare(b.name || '')
      })
    const total = catItems.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0)
    return { cat, items: catItems, total }
  }).filter(g => g.items.length > 0)

  const grandTotal = activeItems.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0)
  const neededCount = items.filter(i => i.status === ITEM_STATUS.NEEDED).length

  return (
    <div className="min-h-dvh bg-stone-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800">
        <div className="px-4 pb-3 flex items-center justify-between"
             style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-100">Items</h1>
            <p className="text-stone-500 text-xs mt-0.5">
              {neededCount} needed · {items.length} total
              {grandTotal > 0 && ` · $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} estimated`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/items/ranking')}
              className="bg-stone-800 border border-stone-700 text-stone-300 p-2.5 rounded-xl active:scale-95 transition-transform"
              title="Priority Ranking">
              <BarChart2 size={18} />
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 py-2.5 px-4">
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-24 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center">
            <Package size={40} className="text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500">No items yet.</p>
            <button onClick={openAdd} className="text-amber-500 text-sm mt-2 underline underline-offset-2">
              Add your first item
            </button>
          </div>
        ) : (
          <>
            {grouped.map(({ cat, items: catItems, total }) => (
              <section key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-base font-semibold text-stone-300">{cat}</h2>
                  {total > 0 && (
                    <span className="text-amber-400 text-xs font-medium">
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {catItems.map(item => (
                    <ItemCard key={item.id} item={item}
                      onEdit={openEdit}
                      onDelete={setConfirmDelete}
                      onStatusChange={() => {}}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* Grand total */}
            {grandTotal > 0 && (
              <div className="card p-4 flex items-center justify-between border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-500" />
                  <span className="text-stone-300 font-medium">Total Estimate</span>
                </div>
                <span className="text-amber-400 font-bold text-lg">
                  ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            )}

            {/* Not Needed */}
            {notNeededItems.length > 0 && (
              <section>
                <button onClick={() => setShowNotNeeded(o => !o)}
                  className="flex items-center gap-2 mb-2 w-full">
                  <h2 className="font-display text-base font-semibold text-stone-600">Not Needed</h2>
                  <span className="text-xs text-stone-700 bg-stone-800 px-2 py-0.5 rounded-full">{notNeededItems.length}</span>
                  <span className="text-stone-700 text-xs ml-auto">{showNotNeeded ? '▲' : '▼'}</span>
                </button>
                {showNotNeeded && (
                  <div className="space-y-2">
                    {notNeededItems.map(item => (
                      <ItemCard key={item.id} item={item} onEdit={openEdit} onDelete={setConfirmDelete} onStatusChange={() => {}} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* Form sheet */}
      {showForm && (
        <ItemFormSheet
          item={editingItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingItem(null) }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this item?"
          message={`"${confirmDelete.name}" will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          confirmLabel="Delete"
        />
      )}
    </div>
  )
}
