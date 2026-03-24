import { useEffect, useState } from 'react'
import { Plus, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsApi } from '../../api/services'
import { PageLoader, StatusBadge, Modal, FormField, Table, EmptyState, Spinner } from '../../components/common'
import { getErrorMessage } from '../../utils/helpers'

export default function SettingsPage() {
  const [tab, setTab] = useState('company')
  const TABS = [['company','Perusahaan'],['users','Pengguna'],['accounts','Chart of Accounts'],['departments','Departemen']]

  return (
    <div className="space-y-5 animate-fade-in">
      <div><h1 className="page-title">Pengaturan</h1><p className="text-sm text-surface-500">Konfigurasi sistem ERP</p></div>
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white' : 'text-surface-500'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'company'     && <CompanySettings />}
      {tab === 'users'       && <UsersSettings />}
      {tab === 'accounts'    && <AccountsSettings />}
      {tab === 'departments' && <DepartmentsSettings />}
    </div>
  )
}

function CompanySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', npwp:'', address:'', phone:'', email:'', website:'', bank_name:'', bank_account:'' })

  useEffect(() => {
    settingsApi.getCompany().then(r => { const d = r.data.data || {}; setForm({ name: d.name||'', npwp: d.npwp||'', address: d.address||'', phone: d.phone||'', email: d.email||'', website: d.website||'', bank_name: d.bank_name||'', bank_account: d.bank_account||'' }) }).catch(()=>{}).finally(() => setLoading(false))
  }, [])

  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) })

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await settingsApi.updateCompany(form); toast.success('Profil perusahaan disimpan') }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setSaving(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="card p-6 max-w-2xl">
      <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Profil Perusahaan</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nama Perusahaan" required><input className="input" {...f('name')} required /></FormField>
          <FormField label="NPWP"><input className="input" {...f('npwp')} /></FormField>
          <FormField label="Email"><input type="email" className="input" {...f('email')} /></FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
          <FormField label="Website"><input className="input" {...f('website')} /></FormField>
          <FormField label="Nama Bank"><input className="input" {...f('bank_name')} /></FormField>
          <FormField label="No. Rekening"><input className="input" {...f('bank_account')} /></FormField>
        </div>
        <FormField label="Alamat"><textarea className="input" rows={3} {...f('address')} /></FormField>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <Spinner size="sm" />} Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}

function UsersSettings() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showReset, setShowReset] = useState(null)

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    settingsApi.getUsers({ limit: 50 }).then(r => setUsers(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Manajemen Pengguna</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-xs"><Plus className="w-3.5 h-3.5"/>User Baru</button>
      </div>
      {loading ? <PageLoader /> : (
        <Table>
          <thead><tr><th>Username</th><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-mono text-xs font-medium">{u.username}</td>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td><StatusBadge status={u.role} /></td>
                <td><StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} label={u.is_active ? 'Aktif' : 'Nonaktif'} /></td>
                <td><button onClick={() => setShowReset(u)} className="text-xs text-yellow-600 hover:underline">Reset Password</button></td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6}><EmptyState icon={Settings} title="Belum ada user" /></td></tr>}
          </tbody>
        </Table>
      )}
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load() }} />
      <ResetPasswordModal user={showReset} onClose={() => setShowReset(null)} onSuccess={() => setShowReset(null)} />
    </div>
  )
}

function CreateUserModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username:'', email:'', password:'', full_name:'', role:'STAFF', phone:'' })
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) })
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await settingsApi.createUser(form); toast.success('User berhasil dibuat'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Buat User Baru">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username" required><input className="input" {...f('username')} required /></FormField>
          <FormField label="Email" required><input type="email" className="input" {...f('email')} required /></FormField>
          <FormField label="Password" required><input type="password" className="input" {...f('password')} minLength={8} required /></FormField>
          <FormField label="Nama Lengkap" required><input className="input" {...f('full_name')} required /></FormField>
          <FormField label="Role" required>
            <select className="input" {...f('role')}>
              {['SUPER_ADMIN','ADMIN','MANAGER','FINANCE','HR','STAFF','VIEW_ONLY'].map(r => <option key={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Buat User</button></div>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await settingsApi.resetPassword(user.id, { newPassword }); toast.success('Password berhasil direset'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={!!user} onClose={onClose} title={`Reset Password · ${user?.username}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Password Baru" required>
          <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required placeholder="Min. 8 karakter" />
        </FormField>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Reset</button></div>
      </form>
    </Modal>
  )
}

function AccountsSettings() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = () => {
    setLoading(true)
    settingsApi.getAccounts({ type: typeFilter || undefined, limit: 100 }).then(r => setAccounts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [typeFilter])

  const TYPES = ['','ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','COGS']

  return (
    <div className="card">
      <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'}`}>
              {t || 'Semua'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 text-xs"><Plus className="w-3.5 h-3.5"/>Akun Baru</button>
      </div>
      {loading ? <PageLoader /> : (
        <Table>
          <thead><tr><th>Kode</th><th>Nama Akun</th><th>Tipe</th></tr></thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id}>
                <td className="font-mono text-sm font-semibold">{a.code}</td>
                <td>{a.name}</td>
                <td><StatusBadge status={a.account_type} /></td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={3}><EmptyState icon={Settings} title="Belum ada akun" /></td></tr>}
          </tbody>
        </Table>
      )}
      <CreateAccountModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load() }} />
    </div>
  )
}

function CreateAccountModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ code:'', name:'', account_type:'ASSET' })
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) })
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await settingsApi.createAccount(form); toast.success('Akun berhasil dibuat'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Tambah Akun COA" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Kode Akun" required><input className="input" {...f('code')} placeholder="misal: 1101" required /></FormField>
        <FormField label="Nama Akun" required><input className="input" {...f('name')} required /></FormField>
        <FormField label="Tipe">
          <select className="input" {...f('account_type')}>
            {['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','COGS'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Simpan</button></div>
      </form>
    </Modal>
  )
}

function DepartmentsSettings() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const load = () => {
    setLoading(true)
    settingsApi.getDepartments().then(r => setDepartments(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  return (
    <div className="card">
      <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Departemen</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5 text-xs"><Plus className="w-3.5 h-3.5"/>Departemen</button>
      </div>
      {loading ? <PageLoader /> : (
        <Table>
          <thead><tr><th>Kode</th><th>Nama</th><th>Deskripsi</th><th>Jumlah Karyawan</th></tr></thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id}>
                <td className="font-mono text-xs font-semibold">{d.code}</td>
                <td className="font-medium">{d.name}</td>
                <td className="text-surface-500">{d.description || '-'}</td>
                <td>{d.employee_count || 0} orang</td>
              </tr>
            ))}
            {departments.length === 0 && <tr><td colSpan={4}><EmptyState icon={Settings} title="Belum ada departemen" /></td></tr>}
          </tbody>
        </Table>
      )}
      <CreateDeptModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load() }} />
    </div>
  )
}

function CreateDeptModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', code:'', description:'' })
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) })
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await settingsApi.createDepartment(form); toast.success('Departemen dibuat'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Tambah Departemen" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Nama" required><input className="input" {...f('name')} required /></FormField>
        <FormField label="Kode" required><input className="input" {...f('code')} placeholder="misal: IT, HR, FIN" required /></FormField>
        <FormField label="Deskripsi"><input className="input" {...f('description')} /></FormField>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Simpan</button></div>
      </form>
    </Modal>
  )
}
