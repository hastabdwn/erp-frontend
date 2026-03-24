import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Package, Users, FileText, AlertTriangle, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { dashboardApi } from '../../api/services'
import { StatCard, PageLoader, StatusBadge } from '../../components/common'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { useAuthStore } from '../../store/authStore'

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getSummary(30)
      .then(r => setData(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const fin = data?.financial || {}
  const sal = data?.sales || {}
  const inv = data?.inventory || {}
  const hr = data?.hr || {}
  const pur = data?.purchases || {}

  const cashflow = data?.cashflow_chart || []
  const topProducts = data?.top_products || []
  const overdueInvoices = data?.overdue_invoices || []
  const recentActivity = data?.recent_activity || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
          Selamat datang, {user?.full_name?.split(' ')[0] || user?.username} 👋
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">Ringkasan aktivitas 30 hari terakhir</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(fin.total_revenue, true)} icon={DollarSign} color="green" subtitle={`${fin.revenue_transactions || 0} transaksi`} />
        <StatCard title="Total Penjualan" value={formatCurrency(sal.total_revenue, true)} icon={TrendingUp} color="blue" subtitle={`${sal.total_orders || 0} order`} />
        <StatCard title="Total Pembelian" value={formatCurrency(pur.total_amount, true)} icon={ShoppingCart} color="yellow" subtitle={`${pur.total_orders || 0} PO`} />
        <StatCard title="Nilai Inventori" value={formatCurrency(inv.total_value, true)} icon={Package} color="purple" subtitle={`${inv.total_products || 0} produk`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Arus Kas 30 Hari</h2>
          {cashflow.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cashflow}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => formatDate(v, 'dd/MM')} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v / 1e6).toFixed(0)}jt`} />
                <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={v => formatDate(v)} />
                <Area type="monotone" dataKey="inflow" name="Pemasukan" stroke="#3b82f6" fill="url(#gIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="outflow" name="Pengeluaran" stroke="#ef4444" fill="url(#gOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-surface-400">Belum ada data transaksi</div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">SDM</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-surface-400 text-xs">Karyawan aktif</p><p className="font-semibold">{hr.total_employees || 0}</p></div>
              <div><p className="text-surface-400 text-xs">Cuti pending</p><p className="font-semibold text-yellow-600">{hr.pending_leaves || 0}</p></div>
              <div><p className="text-surface-400 text-xs">Hadir hari ini</p><p className="font-semibold text-green-600">{hr.present_today || 0}</p></div>
              <div><p className="text-surface-400 text-xs">Absen</p><p className="font-semibold text-red-600">{hr.absent_today || 0}</p></div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Peringatan</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-400 text-xs">Stok menipis</span>
                <span className="font-semibold text-orange-600">{inv.low_stock_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400 text-xs">Invoice overdue</span>
                <span className="font-semibold text-red-600">{overdueInvoices.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400 text-xs">PR pending</span>
                <span className="font-semibold text-yellow-600">{pur.pending_prs || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        {/* <div className="card p-5">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Produk Terlaris</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-surface-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${Math.min(100, (p.total_qty / (topProducts[0]?.total_qty || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-500">{p.total_qty} unit</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-surface-700 dark:text-surface-300">
                    {formatCurrency(p.total_revenue, true)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Belum ada data penjualan</p>
          )}
        </div> */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Produk Terlaris</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-surface-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${Math.min(100, (parseFloat(p.total_qty) / (parseFloat(topProducts[0]?.total_qty) || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-500">{parseFloat(p.total_qty || 0).toLocaleString('id-ID')} unit</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-surface-700 dark:text-surface-300">
                    {formatCurrency(p.total_revenue, true)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Belum ada data penjualan</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Aktivitas Terbaru</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-surface-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-700 dark:text-surface-300 truncate">
                      {a.description || a.action}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {a.username} · {formatDate(a.created_at, 'dd MMM HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Belum ada aktivitas</p>
          )}
        </div>
      </div>
    </div>
  )
}
