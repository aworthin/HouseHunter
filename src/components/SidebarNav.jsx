import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ShoppingCart } from '../icons'

const NAV_ITEMS = [
  { path: '/', label: 'Houses', icon: Home, match: (p) => p === '/' || p.startsWith('/house') || p.startsWith('/add') || p.startsWith('/ranking') },
  { path: '/items', label: 'Items', icon: ShoppingCart, match: (p) => p.startsWith('/items') },
]

export default function SidebarNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <div className='hidden md:flex flex-col w-56 bg-stone-950 border-r border-stone-800 shrink-0'
         style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className='px-4 pt-6 pb-4'>
        <h1 className='font-display text-xl font-bold text-stone-100'>HouseHunter</h1>
      </div>
      <nav className='flex-1 px-3 space-y-1'>
        {NAV_ITEMS.map(({ path, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <button key={path} onClick={() => navigate(path)}
              className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all active:scale-[0.98] ' + (active ? 'bg-amber-500/15 text-amber-400' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200')}>
              <Icon size={18} />
              <span className='font-medium text-sm'>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
