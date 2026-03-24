import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { logsApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Table, EmptyState } from '../../components/common'
import { formatDateTime, getErrorMessage } from '../../utils/helpers'
import { clsx } from 'clsx'

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ module: '', level: '' })
  const [tab, setTab] = useState('logs')

  useEffect(() => { if (tab === 'logs') loadLogs() }, [page, search, filters, tab])
  useEffect(() => { if (tab === 'stats') loadStats() }, [tab])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const { data } = await logsApi.getLogs({ page, limit: 30, search, module: filters.module || undefined, level: filters.level || undefined })
      setLogs(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data } = await logsApi.getStats({ days: 7 })
      setStats(data.data || null)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const levelColor = (level) => {
    if (level === 'ERROR')   return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
    if (level === 'WARNING') return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
  }

  const MODULES = ['','AUTH','DASHBOARD','SETTINGS','FINANCE','INVOICE','INVENTORY','PURCHASE','SALES','PRODUCTION','HR','PAYROLL']

  return (
    <div className="space-y-5 animate-fade-in">
      <div><h1 className="page-title">Log Aktivitas</h1><p className="text-sm text-surface-500">Audit trail seluruh aktivitas sistem</p></div>

      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {[['logs','Log'],['stats','Statistik']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <div className="card">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-3 flex-wrap">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Cari aktivitas..." />
            <select className="input w-auto text-xs" value={filters.module} onChange={e => setFilters(f => ({ ...f, module: e.target.value }))}>
              <option value="">Semua Modul</option>
              {MODULES.filter(Boolean).map(m => <option key={m}>{m}</option>)}
            </select>
            <select className="input w-auto text-xs" value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}>
              <option value="">Semua Level</option>
              {['INFO','WARNING','ERROR'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {loading ? <PageLoader /> : (
            <>
              <Table>
                <thead><tr><th>Waktu</th><th>Level</th><th>Modul</th><th>Aksi</th><th>User</th><th>Keterangan</th></tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="font-mono text-xs whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      <td>
                        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold', levelColor(log.level))}>
                          {log.level}
                        </span>
                      </td>
                      <td><span className="text-xs font-medium text-surface-600 dark:text-surface-400">{log.module}</span></td>
                      <td className="font-mono text-xs">{log.action}</td>
                      <td className="text-xs">{log.username || '-'}</td>
                      <td className="max-w-xs truncate text-surface-500 text-xs">{log.description}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={6}><EmptyState icon={Activity} title="Belum ada log" /></td></tr>}
                </tbody>
              </Table>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      )}

      {tab === 'stats' && (
        loading ? <PageLoader /> : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Aktivitas per Modul</h2>
              <div className="space-y-2">
                {stats.by_module?.map(m => (
                  <div key={m.module} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-28 text-surface-600 dark:text-surface-400">{m.module}</span>
                    <div className="flex-1 h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (m.count / (stats.by_module[0]?.count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-surface-500 w-8 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Per Level (7 hari)</h2>
              <div className="grid grid-cols-3 gap-3">
                {stats.by_level?.map(l => (
                  <div key={l.level} className={clsx('rounded-lg p-3 text-center', levelColor(l.level))}>
                    <p className="text-2xl font-bold">{l.count}</p>
                    <p className="text-xs font-semibold mt-1">{l.level}</p>
                  </div>
                ))}
              </div>
              <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mt-5 mb-3">Top User Aktif</h2>
              {stats.top_users?.slice(0, 5).map((u, i) => (
                <div key={u.username} className="flex items-center justify-between text-sm py-1">
                  <span className="text-surface-600 dark:text-surface-400"><span className="text-surface-400 mr-2">{i+1}.</span>{u.username}</span>
                  <span className="font-medium">{u.count} aksi</span>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="text-surface-400 text-sm text-center py-8">Tidak ada data statistik</p>
      )}
    </div>
  )
}
