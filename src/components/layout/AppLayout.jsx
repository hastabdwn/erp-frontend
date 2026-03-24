import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={clsx(
        'transition-all duration-300 min-h-screen',
        collapsed ? 'ml-16' : 'ml-60'
      )}>
        <div className="p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
