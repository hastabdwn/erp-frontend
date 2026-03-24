import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export const formatCurrency = (amount, short = false) => {
  const num = parseFloat(amount) || 0
  if (short && num >= 1_000_000_000) return `Rp ${(num/1_000_000_000).toFixed(1)}M`
  if (short && num >= 1_000_000) return `Rp ${(num/1_000_000).toFixed(1)}jt`
  if (short && num >= 1_000) return `Rp ${(num/1_000).toFixed(0)}rb`
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
}

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '-'
  try { return format(typeof date === 'string' ? parseISO(date) : date, fmt, { locale: id }) }
  catch { return date }
}

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy HH:mm')

export const statusColor = (status) => {
  const map = {
    ACTIVE: 'green', APPROVED: 'green', POSTED: 'green', PAID: 'green',
    CONFIRMED: 'green', SHIPPED: 'green', COMPLETED: 'green', PROCESSED: 'green',
    PENDING: 'yellow', DRAFT: 'yellow', IN_PROGRESS: 'blue', SENT: 'blue',
    PROBATION: 'yellow', PRESENT: 'green', ABSENT: 'red', SICK: 'yellow',
    REJECTED: 'red', OVERDUE: 'red', CANCELLED: 'red', INACTIVE: 'gray',
    LEAVE: 'purple', RECEIVED: 'green', PARTIAL: 'yellow',
  }
  return map[status] || 'gray'
}

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Terjadi kesalahan'

export const formatNumber = (n) =>
  new Intl.NumberFormat('id-ID').format(parseFloat(n) || 0)
