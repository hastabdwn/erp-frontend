import { useEffect, useState } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { payrollApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [showProcess, setShowProcess] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const now = new Date()
  const [filterMonth] = useState(now.getMonth() + 1)
  const [filterYear] = useState(now.getFullYear())

  useEffect(() => { load() }, [page])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await payrollApi.getList({ page, limit: 20 })
      setPayrolls(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try { await payrollApi.approve(id); toast.success('Payroll disetujui'); load() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data payroll ini? Data detail gaji karyawan akan ikut terhapus.')) return
    setActionLoading(id)
    try { await payrollApi.deleteRun(id); toast.success('Payroll dihapus'); load() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Penggajian</h1><p className="text-sm text-surface-500">Hitung dan proses gaji karyawan</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Hitung Gaji
        </button>
      </div>

      <div className="card">
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead><tr><th>Periode</th><th>Total Karyawan</th><th>Total Gaji Bruto</th><th>Total Potongan</th><th>Total Gaji Bersih</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {payrolls.map(p => (
                  <tr key={p.id}>
                    <td className="font-medium">{['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][p.month] || p.month}/{p.year}</td>
                    <td>{p.employee_count || p.total_employees || 0} karyawan</td>
                    <td>{formatCurrency(p.total_gross_salary || p.total_gross || 0)}</td>
                    <td className="text-red-600">{formatCurrency(p.total_deductions || p.total_deduction || 0)}</td>
                    <td className="font-semibold text-green-600">{formatCurrency(p.total_net_salary || p.total_net || 0)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="space-x-2">
                      {p.status === 'DRAFT'    && <button onClick={() => handleApprove(p.id)} disabled={actionLoading===p.id} className="text-xs text-blue-600 hover:underline">Setujui</button>}
                      {p.status === 'APPROVED' && <button onClick={() => setShowProcess(p)} className="text-xs text-green-600 hover:underline">Proses</button>}
                      {(p.status === 'DRAFT' || p.status === 'APPROVED') && (
                        <button onClick={() => handleDelete(p.id)} disabled={actionLoading===p.id} className="text-xs text-red-500 hover:underline">Hapus</button>
                      )}
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && <tr><td colSpan={7}><EmptyState icon={CreditCard} title="Belum ada data penggajian" description="Klik Hitung Gaji untuk memulai" /></td></tr>}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <CreatePayrollModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load() }} />
      <ProcessPayrollModal payroll={showProcess} onClose={() => setShowProcess(null)} onSuccess={() => { setShowProcess(null); load() }} />
    </div>
  )
}

function CreatePayrollModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const now = new Date()
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), department_id: '' })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = { month: parseInt(form.month), year: parseInt(form.year) }
      if (form.department_id) payload.department_id = parseInt(form.department_id)
      await payrollApi.createRun(payload)
      toast.success('Penggajian berhasil dihitung untuk semua karyawan aktif')
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  return (
    <Modal open={open} onClose={onClose} title="Hitung Gaji" size="sm">
      <p className="text-sm text-surface-500 mb-4">
        Sistem akan otomatis menghitung gaji semua karyawan aktif termasuk tunjangan, BPJS, lembur, dan PPh 21.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bulan" required>
            <select className="input" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Tahun" required>
            <input type="number" className="input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} min="2020" max="2030" required />
          </FormField>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <p className="font-semibold">Komponen yang dihitung otomatis:</p>
          <p>✓ Gaji pokok + tunjangan tetap</p>
          <p>✓ Lembur dari data absensi</p>
          <p>✓ Potongan absen</p>
          <p>✓ BPJS Kesehatan (1%) + Ketenagakerjaan JHT (2%) + JP (1%)</p>
          <p>✓ PPh 21 tarif progresif sesuai UU HPP 2021</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Hitung Gaji
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ProcessPayrollModal({ payroll, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ payment_date: new Date().toISOString().slice(0, 10) })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await payrollApi.process(payroll.id, form)
      toast.success('Gaji berhasil diproses dan jurnal dibuat')
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={!!payroll} onClose={onClose} title="Proses Pembayaran Gaji" size="sm">
      <div className="space-y-3 mb-4 text-sm">
        <div className="flex justify-between"><span className="text-surface-500">Periode</span><span className="font-medium">{payroll?.month}/{payroll?.year}</span></div>
        <div className="flex justify-between"><span className="text-surface-500">Total Karyawan</span><span className="font-medium">{payroll?.total_employees}</span></div>
        <div className="flex justify-between"><span className="text-surface-500">Total Gaji Bersih</span><span className="font-semibold text-green-600">{formatCurrency(payroll?.total_net_salary)}</span></div>
      </div>
      <p className="text-xs text-surface-500 mb-4">
        Proses ini akan membuat jurnal otomatis: Debit Beban Gaji → Kredit Kas/Bank
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Tanggal Pembayaran" required>
          <input type="date" className="input" value={form.payment_date} onChange={e => setForm({ payment_date: e.target.value })} required />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Proses Pembayaran</button>
        </div>
      </form>
    </Modal>
  )
}
