// ─── SALES PAGE ────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { salesApi, inventoryApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function SalesPage() {
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
  const [showEditCustomer, setShowEditCustomer] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (tab === 'orders') loadOrders()
    if (tab === 'customers') loadCustomers()
  }, [tab, page, search])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data } = await salesApi.getOrders({ page, limit: 20, search })
      setOrders(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await salesApi.getCustomers({ page, limit: 20, search })
      setCustomers(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const handleConfirm = async (id) => {
    setActionLoading(id)
    try { await salesApi.confirmOrder(id); toast.success('Order dikonfirmasi'); loadOrders() }
    catch (err) { toast.error(getErrorMessage(err)) }
    finally { setActionLoading(null) }
  }

  const handleShip = async (id) => {
    setActionLoading(id)
    try {
      await salesApi.shipOrder(id, { shipping_date: new Date().toISOString().slice(0, 10) })
      toast.success('Order dikirim'); loadOrders()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setActionLoading(null) }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Batalkan Sales Order ini?')) return
    setActionLoading(id)
    try {
      await salesApi.cancelOrder(id, { reason: 'Dibatalkan manual' })
      toast.success('Order dibatalkan'); loadOrders()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Penjualan</h1><p className="text-sm text-surface-500">Sales Order dan manajemen pelanggan</p></div>
        <div className="flex gap-2">
          {tab === 'orders' && <button onClick={() => setShowCreateOrder(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Sales Order</button>}
          {tab === 'customers' && <button onClick={() => setShowCreateCustomer(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Pelanggan</button>}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {[['orders','Sales Order'],['customers','Pelanggan']].map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); setPage(1); setSearch('') }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab===id?'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white':'text-surface-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <SearchInput value={search} onChange={v=>{setSearch(v);setPage(1)}} />
        </div>
        {loading ? <PageLoader /> : (
          <>
            {tab === 'orders' && (
              <Table>
                <thead><tr><th>No. Order</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td className="font-mono text-xs font-medium">{o.so_number}</td>
                      <td>{o.customer_name}</td>
                      <td>{formatDate(o.order_date)}</td>
                      <td className="font-medium">{formatCurrency(o.total_amount)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="space-x-2">
                        {o.status === 'PENDING' && <button onClick={() => handleConfirm(o.id)} disabled={actionLoading===o.id} className="text-xs text-blue-600 hover:underline">Konfirmasi</button>}
                        {o.status === 'CONFIRMED' && <button onClick={() => handleShip(o.id)} disabled={actionLoading===o.id} className="text-xs text-green-600 hover:underline">Kirim</button>}
                        {['PENDING','CONFIRMED'].includes(o.status) && <button onClick={() => handleCancel(o.id)} disabled={actionLoading===o.id} className="text-xs text-red-500 hover:underline">Batal</button>}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={6}><EmptyState icon={TrendingUp} title="Belum ada order" /></td></tr>}
                </tbody>
              </Table>
            )}
            {tab === 'customers' && (
              <Table>
                <thead><tr><th>Kode</th><th>Nama</th><th>Email</th><th>Telepon</th><th>Kota</th><th>Total Order</th><th></th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td className="font-mono text-xs">{c.code || '-'}</td>
                      <td className="font-medium">{c.name}</td>
                      <td>{c.email || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td>{c.city || '-'}</td>
                      <td>{c.total_orders || 0} order</td>
                      <td><button onClick={() => setShowEditCustomer(c)} className="text-xs text-primary-600 hover:underline">Edit</button></td>
                    </tr>
                  ))}
                  {customers.length === 0 && <tr><td colSpan={7}><EmptyState icon={TrendingUp} title="Belum ada pelanggan" /></td></tr>}
                </tbody>
              </Table>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <CreateOrderModal open={showCreateOrder} onClose={() => setShowCreateOrder(false)} onSuccess={() => { setShowCreateOrder(false); loadOrders() }} />
      <CreateCustomerModal open={showCreateCustomer} onClose={() => setShowCreateCustomer(false)} onSuccess={() => { setShowCreateCustomer(false); loadCustomers() }} />
      <EditCustomerModal customer={showEditCustomer} onClose={() => setShowEditCustomer(null)} onSuccess={() => { setShowEditCustomer(null); loadCustomers() }} />
    </div>
  )
}

function CreateCustomerModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', code:'', email:'', phone:'', address:'', city:'', npwp:'', credit_limit:'', payment_terms:'30' })
  const f = k => ({ value: form[k], onChange: e => setForm({...form,[k]:e.target.value}) })
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await salesApi.createCustomer(form); toast.success('Pelanggan ditambahkan'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Tambah Pelanggan">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nama" required><input className="input" {...f('name')} required /></FormField>
          <FormField label="Kode"><input className="input" {...f('code')} /></FormField>
          <FormField label="Email"><input type="email" className="input" {...f('email')} /></FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
          <FormField label="Kota"><input className="input" {...f('city')} /></FormField>
          <FormField label="NPWP"><input className="input" {...f('npwp')} /></FormField>
          <FormField label="Limit Kredit"><input type="number" className="input" {...f('credit_limit')} min="0" /></FormField>
          <FormField label="Termin (hari)"><input type="number" className="input" {...f('payment_terms')} /></FormField>
        </div>
        <FormField label="Alamat"><textarea className="input" rows={2} {...f('address')} /></FormField>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  )
}

function EditCustomerModal({ customer, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({})
  useEffect(() => {
    if (customer) setForm({
      name: customer.name || '', code: customer.code || '',
      email: customer.email || '', phone: customer.phone || '',
      address: customer.address || '', city: customer.city || '',
      npwp: customer.npwp || '', credit_limit: customer.credit_limit || '',
      payment_terms: customer.payment_terms || '30'
    })
  }, [customer])
  const f = k => ({ value: form[k] || '', onChange: e => setForm({...form,[k]:e.target.value}) })
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await salesApi.updateCustomer(customer.id, form); toast.success('Data pelanggan diupdate'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={!!customer} onClose={onClose} title={`Edit Pelanggan · ${customer?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nama" required><input className="input" {...f('name')} required /></FormField>
          <FormField label="Kode"><input className="input" {...f('code')} /></FormField>
          <FormField label="Email"><input type="email" className="input" {...f('email')} /></FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
          <FormField label="Kota"><input className="input" {...f('city')} /></FormField>
          <FormField label="NPWP"><input className="input" {...f('npwp')} /></FormField>
          <FormField label="Limit Kredit"><input type="number" className="input" {...f('credit_limit')} min="0" /></FormField>
          <FormField label="Termin (hari)"><input type="number" className="input" {...f('payment_terms')} /></FormField>
        </div>
        <FormField label="Alamat"><textarea className="input" rows={2} {...f('address')} /></FormField>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  )
}

function CreateOrderModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    customer_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date: '',
    items: [{ product_id: '', quantity: '', unit_price: '' }]
  })

  useEffect(() => {
    if (open) {
      salesApi.getCustomers({ limit: 100 }).then(r => setCustomers(r.data.data || [])).catch(() => {})
      inventoryApi.getProducts({ limit: 100 }).then(r => {
        const raw = r.data.data
        setProducts(Array.isArray(raw) ? raw : (raw?.data || []))
      }).catch(() => {})
    } else {
      setForm({ customer_id: '', order_date: new Date().toISOString().slice(0, 10), delivery_date: '', items: [{ product_id: '', quantity: '', unit_price: '' }] })
    }
  }, [open])

  const updateItem = (i, k, v) => {
    const items = [...form.items]
    items[i] = { ...items[i], [k]: v }
    setForm({ ...form, items })
  }
  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: '', unit_price: '' }] })
  const removeItem = (i) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) }) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        // Sanitasi tanggal — jangan kirim string kosong ke backend
        order_date: form.order_date || new Date().toISOString().slice(0, 10),
        delivery_date: form.delivery_date && form.delivery_date.trim() !== '' ? form.delivery_date : null,
        items: form.items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseFloat(i.quantity),
          unit_price: parseFloat(i.unit_price)
        }))
      }
      await salesApi.createOrder(payload)
      toast.success('Sales Order dibuat')
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Sales Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Pelanggan" required>
            <select className="input" value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required>
              <option value="">Pilih pelanggan</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Tanggal Order" required>
            <input type="date" className="input" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} required />
          </FormField>
          <FormField label="Tanggal Kirim">
            <input type="date" className="input" value={form.delivery_date} onChange={e => setForm({...form, delivery_date: e.target.value})} />
          </FormField>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Item</label>
            <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:underline">+ Tambah item</button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2 items-center">
              <select className="input text-xs" value={item.product_id} onChange={e => {
                const p = products.find(p => p.id === parseInt(e.target.value))
                const items = [...form.items]
                items[i] = { ...items[i], product_id: e.target.value, unit_price: p?.selling_price || items[i].unit_price }
                setForm({...form, items})
              }} required>
                <option value="">Pilih produk</option>
                {products.map(p => <option key={p.id} value={String(p.id)}>{p.name} (stok: {parseFloat(p.current_stock||0).toFixed(0)})</option>)}
              </select>
              <input type="number" placeholder="Qty" className="input text-xs" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} min="1" required />
              <div className="flex gap-1">
                <input type="number" placeholder="Harga" className="input text-xs flex-1" value={item.unit_price} onChange={e => updateItem(i,'unit_price',e.target.value)} min="0" required />
                {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1 text-lg leading-none">×</button>}
              </div>
            </div>
          ))}
          {form.items.length > 0 && (
            <div className="text-right text-sm font-medium text-surface-700 dark:text-surface-300 pt-1">
              Total: {new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',minimumFractionDigits:0}).format(
                form.items.reduce((s, i) => s + (parseFloat(i.quantity)||0) * (parseFloat(i.unit_price)||0), 0)
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Buat Order</button>
        </div>
      </form>
    </Modal>
  )
}
