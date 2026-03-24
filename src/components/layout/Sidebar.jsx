import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Settings, DollarSign, FileText, Package,
  ShoppingCart, TrendingUp, Factory, Users, CreditCard,
  Activity, LogOut, ChevronRight, Zap
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../api/services'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/finance',     label: 'Keuangan',      icon: DollarSign },
  { path: '/invoices',    label: 'Invoice',        icon: FileText },
  { path: '/inventory',   label: 'Inventori',      icon: Package },
  { path: '/purchases',   label: 'Pembelian',      icon: ShoppingCart },
  { path: '/sales',       label: 'Penjualan',      icon: TrendingUp },
  { path: '/production',  label: 'Produksi',       icon: Factory },
  { path: '/hr',          label: 'SDM',            icon: Users },
  { path: '/payroll',     label: 'Penggajian',     icon: CreditCard },
  { path: '/logs',        label: 'Log Aktivitas',  icon: Activity },
  { path: '/settings',    label: 'Pengaturan',     icon: Settings },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Berhasil logout')
  }

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen bg-surface-950 dark:bg-black flex flex-col z-40 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-surface-800">
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm tracking-tight">ERP System</span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-md hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
        >
          <ChevronRight className={clsx('w-4 h-4 transition-transform duration-300', !collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors group',
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-surface-400 hover:bg-surface-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-surface-800">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-surface-500 truncate">{user?.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-surface-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
