import { useEffect, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { hrApi, settingsApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatDate, getErrorMessage } from '../../utils/helpers'

export default function HRPage() {
  const [tab, setTab] = useState('employees')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditEmployee, setShowEditEmployee] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { load() }, [tab, page, search])

  const load = async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'employees')  res = await hrApi.getEmployees({ page, limit: 20, search })
      if (tab === 'attendance') res = await hrApi.getAttendance({ page, limit: 20 })
      if (tab === 'leaves')     res = await hrApi.getLeaves({ page, limit: 20 })
      setItems(res?.data?.data || [])
      setTotalPages(res?.data?.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const handleLeaveAction = async (id, status) => {
    setActionLoading(id)
    try { await hrApi.approveLeave(id, { status }); toast.success(`Cuti ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`); load() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  const TABS = [['employees','Karyawan'],['attendance','Absensi'],['leaves','Cuti']]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">SDM</h1><p className="text-sm text-surface-500">Karyawan, absensi, dan cuti</p></div>
        <div className="flex gap-2">
          {tab === 'employees' && <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Karyawan</button>}
          {tab === 'attendance' && <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Catat Absensi</button>}
          {tab === 'leaves' && <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Ajukan Cuti</button>}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setPage(1); setSearch('') }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'employees' && (
          <div className="p-4 border-b border-surface-200 dark:border-surface-800">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Cari karyawan..." />
          </div>
        )}
        {loading ? <PageLoader /> : (
          <>
            {tab === 'employees' && (
              <Table>
                <thead><tr><th>NIK/No.</th><th>Nama</th><th>Departemen</th><th>Jabatan</th><th>Status</th><th>Tipe</th><th>Tanggal Masuk</th><th></th></tr></thead>
                <tbody>
                  {items.map(e => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.employee_number}</td>
                      <td className="font-medium">{e.full_name}</td>
                      <td>{e.department_name || '-'}</td>
                      <td>{e.position_name || '-'}</td>
                      <td><StatusBadge status={e.employment_status || 'ACTIVE'} /></td>
                      <td><StatusBadge status={e.employment_type || 'FULL_TIME'} label={e.employment_type === 'FULL_TIME' ? 'Tetap' : e.employment_type === 'PART_TIME' ? 'Part-Time' : 'Kontrak'} /></td>
                      <td>{formatDate(e.hire_date)}</td>
                      <td><button onClick={() => setShowEditEmployee(e)} className="text-xs text-primary-600 hover:underline">Edit</button></td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={8}><EmptyState icon={Users} title="Belum ada karyawan" /></td></tr>}
                </tbody>
              </Table>
            )}

            {tab === 'attendance' && (
              <Table>
                <thead><tr><th>Karyawan</th><th>Tanggal</th><th>Masuk</th><th>Keluar</th><th>Lembur</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map((a, i) => (
                    <tr key={i}>
                      <td className="font-medium">{a.employee_name || a.full_name}</td>
                      <td>{formatDate(a.date)}</td>
                      <td>{a.check_in || '-'}</td>
                      <td>{a.check_out || '-'}</td>
                      <td>{a.overtime_hours ? `${a.overtime_hours} jam` : '-'}</td>
                      <td><StatusBadge status={a.status} label={a.status === 'PRESENT' ? 'Hadir' : a.status === 'ABSENT' ? 'Absen' : a.status === 'SICK' ? 'Sakit' : a.status === 'LEAVE' ? 'Cuti' : a.status} /></td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={6}><EmptyState icon={Users} title="Belum ada data absensi" /></td></tr>}
                </tbody>
              </Table>
            )}

            {tab === 'leaves' && (
              <Table>
                <thead><tr><th>Karyawan</th><th>Tipe Cuti</th><th>Mulai</th><th>Selesai</th><th>Hari</th><th>Alasan</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {items.map(l => (
                    <tr key={l.id}>
                      <td className="font-medium">{l.employee_name || l.full_name}</td>
                      <td><StatusBadge status={l.leave_type} label={l.leave_type === 'ANNUAL' ? 'Tahunan' : l.leave_type === 'SICK' ? 'Sakit' : l.leave_type === 'MATERNITY' ? 'Hamil' : l.leave_type === 'UNPAID' ? 'Tanpa Gaji' : l.leave_type} /></td>
                      <td>{formatDate(l.start_date)}</td>
                      <td>{formatDate(l.end_date)}</td>
                      <td>{l.total_days || '-'} hari</td>
                      <td className="max-w-xs truncate text-surface-500">{l.reason || '-'}</td>
                      <td><StatusBadge status={l.status} /></td>
                      <td className="space-x-2">
                        {l.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleLeaveAction(l.id, 'APPROVED')} disabled={actionLoading === l.id} className="text-xs text-green-600 hover:underline">Setujui</button>
                            <button onClick={() => handleLeaveAction(l.id, 'REJECTED')} disabled={actionLoading === l.id} className="text-xs text-red-600 hover:underline">Tolak</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={8}><EmptyState icon={Users} title="Belum ada pengajuan cuti" /></td></tr>}
                </tbody>
              </Table>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {tab === 'employees'  && <CreateEmployeeModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {tab === 'attendance' && <RecordAttendanceModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {tab === 'leaves'     && <SubmitLeaveModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      <EditEmployeeModal employee={showEditEmployee} onClose={() => setShowEditEmployee(null)} onSuccess={() => { setShowEditEmployee(null); load() }} />
    </div>
  )
}

function CreateEmployeeModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ employee_number:'', full_name:'', hire_date:'', email:'', phone:'', gender:'MALE', employment_status:'ACTIVE', employment_type:'FULL_TIME', basic_salary:'', department_id:'', marital_status:'TK', dependents:'0' })

  useEffect(() => {
    if (open) settingsApi.getDepartments().then(r => setDepartments(r.data.data || [])).catch(() => {})
  }, [open])

  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await hrApi.createEmployee({ ...form, department_id: form.department_id ? parseInt(form.department_id) : undefined, basic_salary: parseFloat(form.basic_salary) || 0, dependents: parseInt(form.dependents) || 0 })
      toast.success('Karyawan ditambahkan'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Karyawan Baru" size="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. Karyawan" required><input className="input" {...f('employee_number')} required /></FormField>
          <FormField label="Nama Lengkap" required><input className="input" {...f('full_name')} required /></FormField>
          <FormField label="Tanggal Masuk" required><input type="date" className="input" {...f('hire_date')} required /></FormField>
          <FormField label="Departemen">
            <select className="input" {...f('department_id')}>
              <option value="">Pilih departemen</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Email"><input type="email" className="input" {...f('email')} /></FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
          <FormField label="Jenis Kelamin">
            <select className="input" {...f('gender')}><option value="MALE">Laki-laki</option><option value="FEMALE">Perempuan</option></select>
          </FormField>
          <FormField label="Status Kerja">
            <select className="input" {...f('employment_status')}><option value="ACTIVE">Aktif</option><option value="PROBATION">Percobaan</option></select>
          </FormField>
          <FormField label="Tipe Kontrak">
            <select className="input" {...f('employment_type')}><option value="FULL_TIME">Tetap</option><option value="PART_TIME">Part-Time</option><option value="CONTRACT">Kontrak</option></select>
          </FormField>
          <FormField label="Gaji Pokok"><input type="number" className="input" {...f('basic_salary')} min="0" /></FormField>
          <FormField label="Status Pajak">
            <select className="input" {...f('marital_status')}><option value="TK">TK (Tidak Kawin)</option><option value="K">K (Kawin)</option></select>
          </FormField>
          <FormField label="Tanggungan">
            <select className="input" {...f('dependents')}>{[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}</select>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Simpan</button></div>
      </form>
    </Modal>
  )
}

function RecordAttendanceModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employee_id:'', date: new Date().toISOString().slice(0,10), check_in:'08:00', check_out:'17:00', status:'PRESENT', overtime_hours:'0' })

  useEffect(() => {
    if (open) hrApi.getEmployees({ limit: 100 }).then(r => setEmployees(r.data.data || [])).catch(() => {})
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await hrApi.recordAttendance({ ...form, employee_id: parseInt(form.employee_id), overtime_hours: parseFloat(form.overtime_hours) || 0 })
      toast.success('Absensi dicatat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Catat Absensi" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Karyawan" required>
          <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
            <option value="">Pilih karyawan</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </FormField>
        <FormField label="Tanggal" required><input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></FormField>
        <FormField label="Status">
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['PRESENT','ABSENT','SICK','LEAVE','HOLIDAY'].map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        {form.status === 'PRESENT' && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Jam Masuk"><input type="time" className="input" value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></FormField>
            <FormField label="Jam Keluar"><input type="time" className="input" value={form.check_out} onChange={e => setForm({ ...form, check_out: e.target.value })} /></FormField>
            <FormField label="Lembur (jam)"><input type="number" className="input" value={form.overtime_hours} onChange={e => setForm({ ...form, overtime_hours: e.target.value })} min="0" step="0.5" /></FormField>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Simpan</button></div>
      </form>
    </Modal>
  )
}

function SubmitLeaveModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employee_id:'', leave_type:'ANNUAL', start_date:'', end_date:'', reason:'' })

  useEffect(() => {
    if (open) hrApi.getEmployees({ limit: 100 }).then(r => setEmployees(r.data.data || [])).catch(() => {})
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await hrApi.submitLeave({ ...form, employee_id: parseInt(form.employee_id) })
      toast.success('Permohonan cuti diajukan'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajukan Cuti" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Karyawan" required>
          <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required>
            <option value="">Pilih karyawan</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </FormField>
        <FormField label="Tipe Cuti">
          <select className="input" value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
            {['ANNUAL','SICK','MATERNITY','PATERNITY','UNPAID'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Mulai" required><input type="date" className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></FormField>
          <FormField label="Selesai" required><input type="date" className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></FormField>
        </div>
        <FormField label="Alasan"><textarea className="input" rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></FormField>
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Ajukan</button></div>
      </form>
    </Modal>
  )
}

function EditEmployeeModal({ employee, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    if (employee) setForm({
      full_name: employee.full_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      basic_salary: employee.basic_salary || '',
      employment_status: employee.employment_status || 'ACTIVE',
      employment_type: employee.employment_type || 'FULL_TIME',
      bank_name: employee.bank_name || '',
      bank_account: employee.bank_account || '',
      marital_status: employee.marital_status || 'TK',
      dependents: employee.dependents || 0,
    })
  }, [employee])

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm({...form, [k]: e.target.value}) })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await hrApi.updateEmployee(employee.id, form)
      toast.success('Data karyawan diupdate'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={!!employee} onClose={onClose} title={`Edit Karyawan · ${employee?.full_name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nama Lengkap" required><input className="input" {...f('full_name')} required /></FormField>
          <FormField label="Email"><input type="email" className="input" {...f('email')} /></FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
          <FormField label="Gaji Pokok"><input type="number" className="input" {...f('basic_salary')} min="0" /></FormField>
          <FormField label="Status Kerja">
            <select className="input" {...f('employment_status')}>
              {['ACTIVE','PROBATION','INACTIVE','RESIGNED','TERMINATED'].map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Tipe Kerja">
            <select className="input" {...f('employment_type')}>
              <option value="FULL_TIME">Tetap</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Kontrak</option>
            </select>
          </FormField>
          <FormField label="Bank"><input className="input" {...f('bank_name')} /></FormField>
          <FormField label="No. Rekening"><input className="input" {...f('bank_account')} /></FormField>
          <FormField label="Status PTKP">
            <select className="input" {...f('marital_status')}>
              <option value="TK">TK - Tidak Kawin</option>
              <option value="K">K - Kawin</option>
            </select>
          </FormField>
          <FormField label="Tanggungan">
            <select className="input" value={form.dependents ?? 0} onChange={e => setForm({...form, dependents: parseInt(e.target.value)})}>
              {[0,1,2,3].map(n => <option key={n} value={n}>{n} orang</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Alamat"><textarea className="input" rows={2} {...f('address')} /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  )
}
