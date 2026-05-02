import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, ClipboardList } from '../icons'
import { useHouses } from '../App'
import { startTour, saveRoomAnswers, completeTour, changeStatus, STATUS } from '../lib/db'
import { TOUR_ROOMS, ROOM_COUNT } from '../lib/tourRooms'

// ─── Question renderers ────────────────────────────────────────────
function QuestionField({ question, value, onChange }) {
  if (question.type === 'yesno') {
    return (
      <div className="flex gap-3">
        {['Yes', 'No'].map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              value === opt
                ? opt === 'Yes'
                  ? 'bg-green-700 text-white border border-green-600'
                  : 'bg-red-900 text-red-200 border border-red-800'
                : 'bg-stone-800 text-stone-400 border border-stone-700'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'choice') {
    return (
      <div className="flex flex-wrap gap-2">
        {question.options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
              value === opt
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-400 border border-stone-700'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  // text (default)
  return question.multiline ? (
    <textarea
      className="input resize-none"
      rows={3}
      placeholder={question.placeholder || ''}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    />
  ) : (
    <input
      className="input"
      placeholder={question.placeholder || ''}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

// ─── Room Menu Sheet ───────────────────────────────────────────────
function RoomMenuSheet({ currentIndex, tourData, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/80" onClick={onClose}>
      <div className="w-full max-w-lg bg-stone-900 rounded-t-2xl border-t border-stone-800 max-h-[80vh] flex flex-col"
           onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-4 pb-3 border-b border-stone-800 flex items-center justify-between">
          <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <p className="text-stone-100 font-semibold">Jump to Room</p>
          <button onClick={onClose} className="text-stone-500 text-sm">Done</button>
        </div>
        <div className="overflow-y-auto p-3 space-y-1 safe-bottom">
          {TOUR_ROOMS.map((room, i) => {
            const isCurrentRoom = i === currentIndex
            const hasAnswers = tourData?.[room.id]?.savedAt
            return (
              <button
                key={room.id}
                onClick={() => { onSelect(i); onClose() }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                  isCurrentRoom ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-stone-800'
                }`}
              >
                <span className="text-xl shrink-0">{room.emoji}</span>
                <span className={`flex-1 text-sm font-medium ${isCurrentRoom ? 'text-amber-400' : 'text-stone-200'}`}>
                  {room.label}
                </span>
                <span className="text-xs shrink-0">
                  {isCurrentRoom
                    ? <span className="text-amber-500">← here</span>
                    : hasAnswers
                    ? <span className="text-green-500">✓</span>
                    : <span className="text-stone-600">{i + 1}</span>
                  }
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main TourModePage ─────────────────────────────────────────────
export default function TourModePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { houses, ranked } = useHouses()
  const house = houses.find(h => h.id === id)

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { roomId: { qId: value } }
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedRooms, setSavedRooms] = useState({})
  const [completing, setCompleting] = useState(false)
  const touchStartX = useRef(null)

  const room = TOUR_ROOMS[currentRoomIndex]
  const isLastRoom = currentRoomIndex === ROOM_COUNT - 1

  // Initialize from existing tour data
  useEffect(() => {
    if (!house) return
    if (!house.tourStartedAt) {
      startTour(house)
    }
    // Load existing answers
    if (house.tourData) {
      const loaded = {}
      for (const roomId of Object.keys(house.tourData)) {
        loaded[roomId] = house.tourData[roomId].answers || {}
      }
      setAnswers(loaded)
      setSavedRooms(
        Object.fromEntries(
          Object.keys(house.tourData).map(k => [k, true])
        )
      )
    }
  }, [house?.id])

  if (!house) return null

  function setAnswer(roomId, questionId, value) {
    setAnswers(prev => ({
      ...prev,
      [roomId]: { ...(prev[roomId] || {}), [questionId]: value }
    }))
  }

  async function handleSaveRoom() {
    const roomAnswers = answers[room.id] || {}
    setSaving(true)
    await saveRoomAnswers(id, room.id, roomAnswers)
    setSavedRooms(prev => ({ ...prev, [room.id]: true }))
    setSaving(false)
  }

  async function goToRoom(index) {
    // Auto-save current room before leaving
    if (answers[room.id]) {
      await saveRoomAnswers(id, room.id, answers[room.id] || {})
      setSavedRooms(prev => ({ ...prev, [room.id]: true }))
    }
    setCurrentRoomIndex(index)
  }

  async function handleNext() {
    if (isLastRoom) return
    await goToRoom(currentRoomIndex + 1)
  }

  async function handlePrev() {
    if (currentRoomIndex === 0) return
    await goToRoom(currentRoomIndex - 1)
  }

  async function handleComplete() {
    setCompleting(true)
    // Save current room first
    await saveRoomAnswers(id, room.id, answers[room.id] || {})
    await completeTour(house)
    navigate('/ranking', { state: { highlightId: id } })
  }

  // Touch swipe
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && !isLastRoom) handleNext()
      else if (diff < 0 && currentRoomIndex > 0) handlePrev()
    }
    touchStartX.current = null
  }

  const completedCount = Object.keys(savedRooms).length

  return (
    <div className="min-h-dvh bg-stone-950 flex flex-col"
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur-md border-b border-stone-800"
           style={{ paddingTop: `max(0.75rem, env(safe-area-inset-top))` }}>
        <div className="px-4 pb-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-stone-400 active:text-stone-200">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-stone-100 font-medium text-sm truncate">{house.address}</p>
            <p className="text-stone-500 text-xs">{completedCount} of {ROOM_COUNT} rooms saved</p>
          </div>
          <button
            onClick={() => setShowRoomMenu(true)}
            className="bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-xl text-stone-300 text-xs font-medium active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <ClipboardList size={13} />
            Rooms
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-stone-800 mx-4 mb-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentRoomIndex + 1) / ROOM_COUNT) * 100}%` }}
          />
        </div>
      </div>

      {/* Room content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32">
        {/* Room header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{room.emoji}</span>
          <div>
            <p className="text-stone-500 text-xs">{currentRoomIndex + 1} of {ROOM_COUNT}</p>
            <h2 className="font-display text-2xl font-bold text-stone-100">{room.label}</h2>
          </div>
          {savedRooms[room.id] && (
            <CheckCircle size={18} className="text-green-500 ml-auto shrink-0" />
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {room.questions.map(q => (
            <div key={q.id}>
              <label className="label mb-2">{q.label}</label>
              <QuestionField
                question={q}
                value={answers[room.id]?.[q.id] || ''}
                onChange={val => setAnswer(room.id, q.id, val)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 px-4 pt-3 safe-bottom">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Prev / Next or Complete */}
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentRoomIndex === 0}
              className="btn-secondary flex items-center justify-center gap-1 px-4 py-3 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            {isLastRoom ? (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                <CheckCircle size={16} />
                {completing ? 'Completing...' : 'Complete Tour'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                Next Room
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Room menu */}
      {showRoomMenu && (
        <RoomMenuSheet
          currentIndex={currentRoomIndex}
          tourData={house.tourData}
          onSelect={goToRoom}
          onClose={() => setShowRoomMenu(false)}
        />
      )}
    </div>
  )
}
