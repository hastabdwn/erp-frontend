import { useEffect, useState } from 'react'
import { Plus, FileText, TrendingUp, Scale } from 'lucide-react'
import toast from 'react-hot-toast'
import { financeApi, settingsApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function FinancePage() {
  const [tab, setTab] = useState('journals')
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: new Date().toISOString().slice(0,10) })

  useEffect(() => { if (tab === 'journals') loadJournals() }, [page, search, tab])
  useEffect(() => { if (tab !== 'journals') loadReport() }, [tab, dateRange])

  const loadJournals = async () => {
    setLoading(true)
    try {
      const { data } = await financeApi.getJournals({ page, limit: 20, search })
      setJournals(data.data || [])
      setTotal(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const loadReport = async () => {
    setReportLoading(true)
    try {
      let res
      if (tab === 'income') res = await financeApi.getIncomeStatement({ start_date: dateRange.start, end_date: dateRange.end })
      if (tab === 'balance') res = await financeApi.getBalanceSheet({ as_of_date: dateRange.end })
      setReport(res?.data?.data || null)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setReportLoading(false) }
  }

  const handlePost = async (id) => {
    try {
      await financeApi.postJournal(id)
      toast.success('Jurnal berhasil diposting')
      loadJournals()
    } catch (err) { toast.error(getErrorMessage(err)) }
  }

  const TABS = [
    { id: 'journals', label: 'Jurnal Umum', icon: FileText },
    { id: 'income',   label: 'Laba Rugi',   icon: TrendingUp },
    { id: 'balance',  label: 'Neraca',       icon: Scale },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Keuangan</h1>
          <p className="text-sm text-surface-500 mt-0.5">Jurnal umum dan laporan keuangan</p>
        </div>
        {tab === 'journals' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Jurnal Baru
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === t.id ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Date Filter for Reports */}
      {tab !== 'journals' && (
        <div className="flex items-center gap-3 card p-3 w-fit">
          <span className="text-sm text-surface-500">Periode:</span>
          {tab === 'income' && (
            <>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="input w-auto" />
              <span className="text-surface-400">–</span>
            </>
          )}
          <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="input w-auto" />
          <button onClick={loadReport} className="btn-primary">Tampilkan</button>
        </div>
      )}

      {/* Journal List */}
      {tab === 'journals' && (
        <div className="card">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari jurnal..." />
          </div>
          {loading ? <PageLoader /> : (
            <>
              <Table>
                <thead><tr>
                  <th>No. Referensi</th><th>Tanggal</th><th>Keterangan</th><th>Tipe</th><th>Status</th><th>Total</th><th></th>
                </tr></thead>
                <tbody>
                  {journals.map(j => (
                    <tr key={j.id}>
                      <td className="font-mono text-xs">{j.reference_number || '-'}</td>
                      <td>{formatDate(j.entry_date)}</td>
                      <td className="max-w-xs truncate">{j.description}</td>
                      <td><StatusBadge status={j.entry_type || 'GENERAL'} /></td>
                      <td><StatusBadge status={j.status} /></td>
                      <td className="font-medium">{formatCurrency(j.total_amount)}</td>
                      <td>
                        {j.status === 'DRAFT' && (
                          <button onClick={() => handlePost(j.id)} className="text-xs text-primary-600 hover:underline">Post</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {journals.length === 0 && <tr><td colSpan={7}><EmptyState icon={FileText} title="Belum ada jurnal" /></td></tr>}
                </tbody>
              </Table>
              <Pagination page={page} totalPages={total} onChange={setPage} />
            </>
          )}
        </div>
      )}

      {/* Income Statement */}
      {tab === 'income' && (
        <div className="card p-5">
          {reportLoading ? <PageLoader /> : report ? (
            <div className="space-y-6">
              <h2 className="font-semibold text-surface-800 dark:text-surface-200">
                Laporan Laba Rugi · {formatDate(report.period?.start_date)} – {formatDate(report.period?.end_date)}
              </h2>
              {[
                { title: 'Pendapatan', rows: report.revenue, total: report.total_revenue, color: 'green' },
                { title: 'Harga Pokok Penjualan', rows: report.cogs, total: report.total_cogs, color: 'red' },
                { title: 'Beban Operasional', rows: report.expenses, total: report.total_expenses, color: 'orange' },
              ].map(sec => (
                <div key={sec.title}>
                  <h3 className="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2">{sec.title}</h3>
                  <div className="space-y-1">
                    {sec.rows?.map(r => (
                      <div key={r.code} className="flex justify-between text-sm py-1">
                        <span className="text-surface-600 dark:text-surface-400">{r.code} · {r.name}</span>
                        <span className="font-medium">{formatCurrency(Math.abs(r.balance))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-surface-200 dark:border-surface-800">
                    <span>Total {sec.title}</span>
                    <span>{formatCurrency(Math.abs(sec.total))}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-4 border-t-2 border-surface-300 dark:border-surface-700">
                <span>Laba Bersih</span>
                <span className={report.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(report.net_profit)}
                </span>
              </div>
            </div>
          ) : <p className="text-surface-400 text-sm text-center py-8">Pilih periode dan klik Tampilkan</p>}
        </div>
      )}

      {/* Balance Sheet */}
      {tab === 'balance' && (
        <div className="card p-5">
          {reportLoading ? <PageLoader /> : report ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3 text-surface-800 dark:text-surface-200">Aset</h3>
                {report.assets?.map(a => (
                  <div key={a.code} className="flex justify-between text-sm py-1">
                    <span className="text-surface-600 dark:text-surface-400">{a.name}</span>
                    <span className="font-medium">{formatCurrency(Math.abs(a.balance))}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-surface-200 dark:border-surface-800 text-sm">
                  <span>Total Aset</span>
                  <span className="text-green-600">{formatCurrency(Math.abs(report.total_assets))}</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-surface-800 dark:text-surface-200">Kewajiban & Ekuitas</h3>
                {report.liabilities?.map(l => (
                  <div key={l.code} className="flex justify-between text-sm py-1">
                    <span className="text-surface-600 dark:text-surface-400">{l.name}</span>
                    <span className="font-medium">{formatCurrency(Math.abs(l.balance))}</span>
                  </div>
                ))}
                {report.equity?.map(e => (
                  <div key={e.code} className="flex justify-between text-sm py-1">
                    <span className="text-surface-600 dark:text-surface-400">{e.name}</span>
                    <span className="font-medium">{formatCurrency(Math.abs(e.balance))}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-surface-200 dark:border-surface-800 text-sm">
                  <span>Total Kewajiban + Ekuitas</span>
                  <span className="text-blue-600">{formatCurrency(Math.abs((report.total_liabilities||0) + (report.total_equity||0)))}</span>
                </div>
              </div>
            </div>
          ) : <p className="text-surface-400 text-sm text-center py-8">Pilih tanggal dan klik Tampilkan</p>}
        </div>
      )}

      <CreateJournalModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadJournals() }} />
    </div>
  )
}

function CreateJournalModal({ open, onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    description: '',
    type: 'EXPENSE',
    lines: [
      { account_id: '', debit: '', credit: '', description: '' },
      { account_id: '', debit: '', credit: '', description: '' },
    ]
  })

  useEffect(() => {
    if (open) settingsApi.getAccounts().then(r => setAccounts(r.data.data || [])).catch(() => {})
  }, [open])

  const updateLine = (i, field, val) => {
    const lines = [...form.lines]
    lines[i] = { ...lines[i], [field]: val }
    setForm({ ...form, lines })
  }

  const addLine = () => setForm({ ...form, lines: [...form.lines, { account_id: '', debit: '', credit: '', description: '' }] })
  const removeLine = (i) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) })

  const totalDebit = form.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isBalanced) return toast.error('Debit dan kredit harus seimbang!')
    setLoading(true)
    try {
      const payload = {
        ...form,
        lines: form.lines.map(l => ({ ...l, account_id: parseInt(l.account_id), debit: parseFloat(l.debit)||0, credit: parseFloat(l.credit)||0 }))
      }
      await financeApi.createJournal(payload)
      toast.success('Jurnal berhasil dibuat')
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Jurnal Baru" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal" required>
            <input type="date" className="input" value={form.entry_date} onChange={e => setForm({...form, entry_date: e.target.value})} required />
          </FormField>
          <FormField label="Tipe">
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['REVENUE','EXPENSE','ADJUSTMENT','PAYROLL','PURCHASE','SALE'].map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Keterangan" required>
          <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
        </FormField>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Baris Jurnal</label>
            <button type="button" onClick={addLine} className="text-xs text-primary-600 hover:underline">+ Tambah baris</button>
          </div>
          <div className="space-y-2">
            {form.lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-4">
                  <select className="input text-xs" value={line.account_id} onChange={e => updateLine(i, 'account_id', e.target.value)} required>
                    <option value="">Pilih akun</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" placeholder="Debit" className="input text-xs" value={line.debit}
                    onChange={e => updateLine(i, 'debit', e.target.value)} min="0" step="0.01" />
                </div>
                <div className="col-span-2">
                  <input type="number" placeholder="Kredit" className="input text-xs" value={line.credit}
                    onChange={e => updateLine(i, 'credit', e.target.value)} min="0" step="0.01" />
                </div>
                <div className="col-span-3">
                  <input placeholder="Keterangan" className="input text-xs" value={line.description}
                    onChange={e => updateLine(i, 'description', e.target.value)} />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {form.lines.length > 2 && (
                    <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs mt-2 font-medium">
            <span>Total Debit: <span className="text-blue-600">{formatCurrency(totalDebit)}</span></span>
            <span>Total Kredit: <span className="text-blue-600">{formatCurrency(totalCredit)}</span></span>
            <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>{isBalanced ? '✓ Balance' : '✗ Tidak Balance'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading || !isBalanced} className="btn-primary flex items-center gap-2">
            {loading && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Simpan Jurnal
          </button>
        </div>
      </form>
    </Modal>
  )
}
