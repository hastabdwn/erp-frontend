import { useEffect, useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseApi, inventoryApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function PurchasesPage() {
  const [tab, setTab] = useState('po')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { load() }, [tab, page, search])

  const load = async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'po')       res = await purchaseApi.getPOs({ page, limit: 20, search })
      if (tab === 'pr')       res = await purchaseApi.getPRs({ page, limit: 20 })
      if (tab === 'suppliers') res = await purchaseApi.getSuppliers({ page, limit: 20, search })
      setItems(res?.data?.data || [])
      setTotalPages(res?.data?.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const handleApprove = async (id, status) => {
    setActionLoading(id)
    try { await purchaseApi.approvePR(id, { status }); toast.success(`PR ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`); load() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  const handleReceive = async (po) => {
    setActionLoading(po.id)
    try {
      const { data: detailData } = await purchaseApi.getPOById(po.id)
      const poItems = detailData.data?.items || []
      if (!poItems.length) { toast.error('Tidak ada item di PO ini'); return }
      await purchaseApi.receiveGoods(po.id, {
        received_date: new Date().toISOString().slice(0, 10),
        items: poItems.map(i => ({ po_item_id: i.id, received_quantity: i.quantity - (i.received_quantity || 0) }))
      })
      toast.success('Barang diterima, stok bertambah'); load()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  const handleApprovePO = async (id, status) => {
    setActionLoading(id)
    try { await purchaseApi.approvePO(id, { status }); toast.success(`PO berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`); load() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  const TABS = [['po','Purchase Order'],['pr','Permintaan Pembelian'],['suppliers','Supplier']]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Pembelian</h1><p className="text-sm text-surface-500">Purchase Order, PR, dan supplier</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {tab === 'po' ? 'Purchase Order' : tab === 'pr' ? 'Permintaan Pembelian' : 'Supplier'}
        </button>
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
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} />
        </div>
        {loading ? <PageLoader /> : (
          <>
            {/* Purchase Orders */}
            {tab === 'po' && (
              <Table>
                <thead><tr><th>No. PO</th><th>Supplier</th><th>Tanggal</th><th>Exp. Delivery</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {items.map(po => (
                    <tr key={po.id}>
                      <td className="font-mono text-xs font-medium">{po.po_number}</td>
                      <td>{po.supplier_name}</td>
                      <td>{formatDate(po.order_date)}</td>
                      <td>{formatDate(po.expected_delivery)}</td>
                      <td className="font-medium">{formatCurrency(po.total_amount)}</td>
                      <td><StatusBadge status={po.status} /></td>
                      <td className="space-x-2">
                        {po.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprovePO(po.id, 'APPROVED')} disabled={actionLoading === po.id} className="text-xs text-green-600 hover:underline font-medium">Setujui</button>
                            <button onClick={() => handleApprovePO(po.id, 'REJECTED')} disabled={actionLoading === po.id} className="text-xs text-red-500 hover:underline">Tolak</button>
                          </>
                        )}
                        {(po.status === 'APPROVED' || po.status === 'PARTIAL') && (
                          <button onClick={() => handleReceive(po)} disabled={actionLoading === po.id} className="text-xs text-blue-600 hover:underline font-medium">Terima Barang</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={7}><EmptyState icon={ShoppingCart} title="Belum ada PO" /></td></tr>}
                </tbody>
              </Table>
            )}

            {/* PRs */}
            {tab === 'pr' && (
              <Table>
                <thead><tr><th>No. PR</th><th>Departemen</th><th>Dibutuhkan</th><th>Total Est.</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {items.map(pr => (
                    <tr key={pr.id}>
                      <td className="font-mono text-xs font-medium">{pr.pr_number}</td>
                      <td>{pr.department_name || '-'}</td>
                      <td>{formatDate(pr.needed_by)}</td>
                      <td>{formatCurrency(pr.total_estimated_amount)}</td>
                      <td><StatusBadge status={pr.status} /></td>
                      <td className="space-x-2">
                        {pr.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(pr.id, 'APPROVED')} disabled={actionLoading === pr.id} className="text-xs text-green-600 hover:underline">Setujui</button>
                            <button onClick={() => handleApprove(pr.id, 'REJECTED')} disabled={actionLoading === pr.id} className="text-xs text-red-600 hover:underline">Tolak</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={6}><EmptyState icon={ShoppingCart} title="Belum ada PR" /></td></tr>}
                </tbody>
              </Table>
            )}

            {/* Suppliers */}
            {tab === 'suppliers' && (
              <Table>
                <thead><tr><th>Kode</th><th>Nama</th><th>Email</th><th>Telepon</th><th>Kota</th><th>Termin</th></tr></thead>
                <tbody>
                  {items.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs">{s.code}</td>
                      <td className="font-medium">{s.name}</td>
                      <td>{s.email || '-'}</td>
                      <td>{s.phone || '-'}</td>
                      <td>{s.city || '-'}</td>
                      <td>{s.payment_terms ? `${s.payment_terms} hari` : '-'}</td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={6}><EmptyState icon={ShoppingCart} title="Belum ada supplier" /></td></tr>}
                </tbody>
              </Table>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {tab === 'po' && <CreatePOModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {tab === 'pr' && <CreatePRModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {tab === 'suppliers' && <CreateSupplierModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function CreateSupplierModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'', code:'', email:'', phone:'', address:'', city:'', npwp:'', payment_terms:'30' })
  const f = k => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) })
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await purchaseApi.createSupplier(form); toast.success('Supplier ditambahkan'); onSuccess() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Tambah Supplier">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nama" required><input className="input" {...f('name')} required /></FormField>
          <FormField label="Kode" required><input className="input" {...f('code')} required /></FormField>
          <FormField label="Email"><input type="email" className="input" {...f('email')} /></FormField>
          <FormField label="Telepon"><input className="input" {...f('phone')} /></FormField>
          <FormField label="Kota"><input className="input" {...f('city')} /></FormField>
          <FormField label="Termin (hari)"><input type="number" className="input" {...f('payment_terms')} /></FormField>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Simpan</button></div>
      </form>
    </Modal>
  )
}

function CreatePRModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ needed_by:'', justification:'', items:[{ description:'', quantity:'', estimated_unit_price:'' }] })

  useEffect(() => {
    if (open) inventoryApi.getProducts({ limit: 100 }).then(r => setProducts(r.data.data || [])).catch(() => {})
  }, [open])

  const updateItem = (i, k, v) => { const items = [...form.items]; items[i] = { ...items[i], [k]: v }; setForm({ ...form, items }) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await purchaseApi.createPR({ ...form, items: form.items.map(i => ({ ...i, quantity: parseFloat(i.quantity), estimated_unit_price: parseFloat(i.estimated_unit_price) || 0 })) })
      toast.success('PR berhasil dibuat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Permintaan Pembelian" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Dibutuhkan Sebelum"><input type="date" className="input" value={form.needed_by} onChange={e => setForm({ ...form, needed_by: e.target.value })} /></FormField>
          <FormField label="Alasan"><input className="input" value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} /></FormField>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Item yang Dibutuhkan</label>
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: '', estimated_unit_price: '' }] })} className="text-xs text-primary-600 hover:underline">+ Tambah</button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input placeholder="Nama barang" className="input text-xs" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
              <input type="number" placeholder="Qty" className="input text-xs" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" required />
              <input type="number" placeholder="Est. harga" className="input text-xs" value={item.estimated_unit_price} onChange={e => updateItem(i, 'estimated_unit_price', e.target.value)} min="0" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Kirim PR</button></div>
      </form>
    </Modal>
  )
}

function CreatePOModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ supplier_id:'', expected_delivery:'', items:[{ product_id:'', quantity:'', unit_price:'' }] })

  useEffect(() => {
    if (open) {
      purchaseApi.getSuppliers({ limit: 100 }).then(r => setSuppliers(r.data.data || [])).catch(() => {})
      inventoryApi.getProducts({ limit: 100 }).then(r => setProducts(r.data.data || [])).catch(() => {})
    }
  }, [open])

  const updateItem = (i, k, v) => { const items = [...form.items]; items[i] = { ...items[i], [k]: v }; setForm({ ...form, items }) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await purchaseApi.createPO({ ...form, supplier_id: parseInt(form.supplier_id), items: form.items.map(i => ({ ...i, product_id: parseInt(i.product_id), quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price) })) })
      toast.success('PO berhasil dibuat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Purchase Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Supplier" required>
            <select className="input" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} required>
              <option value="">Pilih supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Est. Pengiriman"><input type="date" className="input" value={form.expected_delivery} onChange={e => setForm({ ...form, expected_delivery: e.target.value })} /></FormField>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Item</label>
            <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { product_id: '', quantity: '', unit_price: '' }] })} className="text-xs text-primary-600 hover:underline">+ Tambah</button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <select className="input text-xs" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)} required>
                <option value="">Pilih produk</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Qty" className="input text-xs" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="0.01" step="0.01" required />
              <input type="number" placeholder="Harga beli" className="input text-xs" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} min="0" required />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Buat PO</button></div>
      </form>
    </Modal>
  )
}
