import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ShoppingCart } from '../icons'

const TABS = [
  { path: '/', label: 'Houses', icon: Home, match: (p) => p === '/' || p.startsWith('/house') || p.startsWith('/add') || p.startsWith('/ranking') },
  { path: '/items', label: 'Items', icon: ShoppingCart, match: (p) => p.startsWith('/items') },
]

export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Don't show on tour, history, shortcut pages
  const hidden = ['/history', '/shortcut-setup'].some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/house/') && (pathname.endsWith('/tour') || pathname.endsWith('/edit'))

  if (hidden) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-stone-950/95 backdrop-blur-md border-t border-stone-800"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {TABS.map(({ path, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-all active:scale-95 ${
                active ? 'text-amber-500' : 'text-stone-500'
              }`}
            >
              <Icon size={22} />
              <span className={`text-xs font-medium ${active ? 'text-amber-500' : 'text-stone-500'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
