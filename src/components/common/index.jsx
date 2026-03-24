import { clsx } from 'clsx'
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { statusColor } from '../../utils/helpers'

// ── Loading Spinner ───────────────────────────────
export function Spinner({ size = 'md', className }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return <Loader2 className={clsx('animate-spin text-primary-500', s[size], className)} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

// ── Empty State ───────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-surface-400" />
      </div>}
      <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-400 mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ── Error Alert ───────────────────────────────────
export function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  )
}

// ── Status Badge ──────────────────────────────────
export function StatusBadge({ status, label }) {
  const color = statusColor(status)
  const cls = {
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    gray:   'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', cls[color])}>
      {label || status}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full card shadow-2xl animate-scale-in', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <X className="w-4 h-4 text-surface-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, loading, variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-surface-600 dark:text-surface-400 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-secondary">Batal</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={clsx('px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2',
            variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
          )}
        >
          {loading && <Spinner size="sm" />}
          Konfirmasi
        </button>
      </div>
    </Modal>
  )
}

// ── Search Input ──────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Cari...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 w-64"
      />
    </div>
  )
}

// ── Pagination ────────────────────────────────────
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-800">
      <p className="text-sm text-surface-500">Halaman {page} dari {totalPages}</p>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────
export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green:  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1 truncate">{title}</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100 truncate">{value}</p>
          {subtitle && <p className="text-xs text-surface-400 mt-1 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <p className={clsx('text-xs mt-1 font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% dari bulan lalu
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3', colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Table Wrapper ─────────────────────────────────
export function Table({ children, className }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="table-auto w-full">{children}</table>
    </div>
  )
}

// ── Form Field ────────────────────────────────────
export function FormField({ label, required, error, children }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────
export function Select({ options, value, onChange, placeholder, className }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={clsx('input', className)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
