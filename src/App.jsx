import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { subscribeToHouses, subscribeToLatestHistoryId, STATUS, markZillowChecked, addHistory } from './lib/db'
import { getUserName, setUserName, getLastSeenUlid } from './lib/userPrefs'
import { User } from './icons'
import MainPage from './pages/MainPage'
import AddHousePage from './pages/AddHousePage'
import HouseDetailPage from './pages/HouseDetailPage'
import EditHousePage from './pages/EditHousePage'
import TourModePage from './pages/TourModePage'
import RankingPage from './pages/RankingPage'
import ShortcutSetupPage from './pages/ShortcutSetupPage'
import HistoryPage from './pages/HistoryPage'

export const HouseContext = createContext(null)
export function useHouses() { return useContext(HouseContext) }

const SCRAPER_URL = '/api/scrape'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Name Modal ────────────────────────────────────────────────────
function NameModal({ onSave }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-2xl mx-auto mb-4">
          <User size={28} className="text-amber-500" />
        </div>
        <h2 className="font-display text-xl font-semibold text-stone-100 text-center mb-1">
          Welcome to HouseHunter
        </h2>
        <p className="text-stone-500 text-sm text-center mb-6">
          Enter your name so others can see who made changes in the activity history.
        </p>
        <input
          className="input mb-4"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name)}
          autoFocus
        />
        <button
          onClick={() => onSave(name)}
          disabled={!name.trim()}
          className="btn-primary w-full disabled:opacity-40"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}

// ─── Sold Banner ───────────────────────────────────────────────────
function SoldBanner({ houses, onDismiss }) {
  if (!houses.length) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-40 animate-slide-up"
         style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-4 mt-2">
        {houses.map(h => (
          <div key={h.id} className="card mb-2 p-3 border-red-800 bg-red-950/60 flex items-center gap-3">
            <TrendingDown size={16} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm flex-1">
              <span className="font-medium">{h.address}</span> has been sold or is no longer listed.
            </p>
            <button onClick={() => onDismiss(h.id)} className="text-red-500 text-xs shrink-0">Dismiss</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Need TrendingDown in scope for SoldBanner
import { TrendingDown } from './icons'

export default function App() {
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserNameState] = useState(getUserName())
  const [latestHistoryId, setLatestHistoryId] = useState(null)
  const [checkStatus, setCheckStatus] = useState(null) // 'checking' | 'done' | null
  const [newlySold, setNewlySold] = useState([]) // houses just detected as sold
  const [dismissedSold, setDismissedSold] = useState([])
  const [lastSeenUlidState, setLastSeenUlidState] = useState(getLastSeenUlid)

  // Subscribe to houses
  useEffect(() => {
    console.time('[HQ] Firebase connect')
    const unsub = subscribeToHouses((data) => {
      console.timeEnd('[HQ] Firebase connect')
      console.log('[HQ] Houses loaded:', data.length)
      // Migrate old status values to new system
      const migrated = data.map(h => {
        if (h.status === 'pending') return { ...h, status: 'new' }
        if (h.status === 'toured' && h.tourNotes) return { ...h, status: 'toured' }
        if (h.status === 'toured') return { ...h, status: 'reviewed' }
        return h
      })
      setHouses(migrated)
      setLoading(false)
    })
    return unsub
  }, [])

  // Subscribe to latest history ID for badge
  useEffect(() => {
    console.time('[HQ] History connect')
    const unsub = subscribeToLatestHistoryId((id) => {
      console.timeEnd('[HQ] History connect')
      setLatestHistoryId(id)
    })
    return unsub
  }, [])

  // Check stale houses for sold status
  const checkForSold = useCallback(async (houseList) => {
    console.time('[HQ] checkForSold total')
    const active = [STATUS.NEW, STATUS.REVIEWED, STATUS.READY_TO_TOUR, STATUS.TOURED]
    const stale = houseList.filter(h => {
      if (!active.includes(h.status)) return false
      if (!h.zpid) return false
      if (!h.zillowLastChecked) return true
      const lastCheck = h.zillowLastChecked?.toDate?.() || new Date(h.zillowLastChecked)
      return Date.now() - lastCheck.getTime() > CHECK_INTERVAL_MS
    })
    if (!stale.length) return

    setCheckStatus('checking')
    const soldHouses = []

    for (const house of stale) {
      try {
        const res = await fetch(SCRAPER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: house.zillowUrl || `https://www.zillow.com/homedetails/${house.zpid}_zpid/` })
        })
        const data = await res.json()
        const isSold = data._offMarket || data._sold ||
          (data.homeStatus && ['RECENTLY_SOLD', 'SOLD'].includes(data.homeStatus))

        if (isSold) {
          await markZillowChecked(house.id, true)
          await addHistory({
            houseId: house.id,
            address: house.address,
            event: 'status_changed',
            fromStatus: house.status,
            toStatus: STATUS.SOLD,
            note: 'Auto-detected sold by Zillow check',
          })
          soldHouses.push(house)
        } else {
          await markZillowChecked(house.id, false)
        }
      } catch (e) {
        console.log('Sold check failed for', house.address, e.message)
      }
    }

    if (soldHouses.length) setNewlySold(soldHouses)
    console.timeEnd('[HQ] checkForSold total')
    setCheckStatus('done')
    setTimeout(() => setCheckStatus(null), 3000)
  }, [])

  // Run sold check when houses load
  useEffect(() => {
    if (!loading && houses.length && userName) {
      checkForSold(houses)
    }
  }, [loading, userName])

  const handleSaveName = (name) => {
    setUserName(name)
    setUserNameState(name)
  }

  const dismissSold = (id) => {
    setDismissedSold(d => [...d, id])
    setNewlySold(s => s.filter(h => h.id !== id))
  }

  // Derived lists
  const byStatus = (s) => houses.filter(h => h.status === s)
  const ranked = byStatus(STATUS.TOURED).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  const readyToTour = byStatus(STATUS.READY_TO_TOUR)
  const reviewed = byStatus(STATUS.REVIEWED)
  const newHouses = byStatus(STATUS.NEW)
  const rejected = byStatus(STATUS.REJECTED)
  const sold = byStatus(STATUS.SOLD)

  // Unread history badge
  const hasUnreadHistory = latestHistoryId && latestHistoryId !== lastSeenUlidState &&
    (!lastSeenUlidState || latestHistoryId > lastSeenUlidState)

  if (!userName) return <NameModal onSave={handleSaveName} />

  return (
    <HouseContext.Provider value={{
      houses, loading, ranked, readyToTour, reviewed, newHouses, rejected, sold,
      checkStatus, hasUnreadHistory, latestHistoryId, userName,
      setLastSeenUlidState,
      // legacy compat
      toured: ranked, pending: [...reviewed, ...newHouses]
    }}>
      <SoldBanner houses={newlySold} onDismiss={dismissSold} />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/add" element={<AddHousePage />} />
        <Route path="/house/:id" element={<HouseDetailPage />} />
        <Route path="/house/:id/edit" element={<EditHousePage />} />
        <Route path="/house/:id/tour" element={<TourModePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/shortcut-setup" element={<ShortcutSetupPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </HouseContext.Provider>
  )
}
