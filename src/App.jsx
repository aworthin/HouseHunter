import React, { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { subscribeToHouses } from './lib/db'
import MainPage from './pages/MainPage'
import AddHousePage from './pages/AddHousePage'
import HouseDetailPage from './pages/HouseDetailPage'
import EditHousePage from './pages/EditHousePage'
import TourModePage from './pages/TourModePage'
import RankingPage from './pages/RankingPage'
import ShortcutSetupPage from './pages/ShortcutSetupPage'

export const HouseContext = createContext(null)
export function useHouses() { return useContext(HouseContext) }

export default function App() {
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToHouses((data) => {
      setHouses(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const toured = houses
    .filter(h => h.status === 'toured')
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))

  const pending = houses.filter(h => h.status === 'pending')

  return (
    <HouseContext.Provider value={{ houses, toured, pending, loading }}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/add" element={<AddHousePage />} />
        <Route path="/house/:id" element={<HouseDetailPage />} />
        <Route path="/house/:id/edit" element={<EditHousePage />} />
        <Route path="/house/:id/tour" element={<TourModePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/shortcut-setup" element={<ShortcutSetupPage />} />
      </Routes>
    </HouseContext.Provider>
  )
}
