import { useEffect, useState } from 'react'
import { Plus, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { inventoryApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Modal, FormField, Table, EmptyState, StatCard } from '../../components/common'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAdjust, setShowAdjust] = useState(null)
  const [showEdit, setShowEdit] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [tab, setTab] = useState('products')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => { loadProducts() }, [page, search, refreshKey])
  useEffect(() => { loadLowStock() }, [refreshKey])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data } = await inventoryApi.getProducts({ page, limit: 20, search })
      setProducts(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const loadLowStock = async () => {
    try {
      const { data } = await inventoryApi.getLowStock()
      setLowStock(data.data || [])
    } catch (err) {
      console.error('Gagal memuat stok menipis:', err)
    }
  }

  const stockStatus = (p) => {
    const stock = parseFloat(p.current_stock) || 0
    const reorder = parseFloat(p.reorder_point) || 0
    if (stock <= 0) return { label: 'Habis', color: 'red' }
    if (stock <= reorder) return { label: 'Menipis', color: 'yellow' }
    return { label: 'Normal', color: 'green' }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventori</h1>
          <p className="text-sm text-surface-500">Manajemen stok dan produk</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Produk Baru
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>{lowStock.length} produk</strong> stok menipis atau habis — perlu segera direstock
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {[['products','Semua Produk'],['lowstock','Stok Menipis']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === id ? 'bg-white dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500'}`}>
            {label} {id === 'lowstock' && lowStock.length > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{lowStock.length}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Cari produk / SKU..." />
        </div>
        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead><tr>
                <th>SKU</th><th>Nama Produk</th><th>Satuan</th>
                <th>Stok</th><th>Reorder Point</th><th>Harga Beli</th><th>Harga Jual</th><th>Status</th><th></th>
              </tr></thead>
              <tbody>
                {(tab === 'lowstock' ? lowStock : products).map(p => {
                  const st = stockStatus(p)
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td className="font-medium">{p.name}</td>
                      <td>{p.unit}</td>
                      <td className={`font-semibold ${st.color === 'red' ? 'text-red-600' : st.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
                        {parseFloat(p.current_stock || 0) % 1 === 0 ? parseFloat(p.current_stock || 0).toFixed(0) : parseFloat(p.current_stock || 0).toFixed(2)}
                      </td>
                      <td>{p.reorder_point ? parseFloat(p.reorder_point).toLocaleString('id-ID') : '-'}</td>
                      <td>{formatCurrency(p.unit_cost)}</td>
                      <td>{formatCurrency(p.selling_price)}</td>
                      <td><StatusBadge status={st.label === 'Habis' ? 'CANCELLED' : st.label === 'Menipis' ? 'PENDING' : 'ACTIVE'} label={st.label} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => setShowEdit(p)} className="text-xs text-primary-600 hover:underline">Edit</button>
                          <button onClick={() => setShowAdjust(p)} className="text-xs text-surface-500 hover:underline">Sesuaikan</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(tab === 'lowstock' ? lowStock : products).length === 0 && (
                  <tr><td colSpan={9}><EmptyState icon={Package} title="Belum ada produk" /></td></tr>
                )}
              </tbody>
            </Table>
            {tab === 'products' && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
          </>
        )}
      </div>

      <CreateProductModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadProducts() }} />
      <EditProductModal product={showEdit} onClose={() => setShowEdit(null)} onSuccess={() => { setShowEdit(null); setRefreshKey(k => k + 1) }} />
      <AdjustStockModal product={showAdjust} onClose={() => setShowAdjust(null)} onSuccess={() => { setShowAdjust(null); setRefreshKey(k => k + 1) }} />
    </div>
  )
}

function CreateProductModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ sku:'', name:'', unit:'pcs', unit_cost:'', selling_price:'', current_stock:'0', reorder_point:'10', is_raw_material: false })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await inventoryApi.createProduct(form)
      toast.success('Produk berhasil ditambahkan')
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm({...form, [k]: e.target.value}) })

  return (
    <Modal open={open} onClose={onClose} title="Tambah Produk Baru">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="SKU" required><input className="input" {...f('sku')} required /></FormField>
          <FormField label="Satuan" required>
            <select className="input" {...f('unit')}>
              {['pcs','kg','gram','liter','ml','meter','unit','box','karton'].map(u => <option key={u}>{u}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Nama Produk" required><input className="input" {...f('name')} required /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Harga Beli"><input type="number" className="input" {...f('unit_cost')} min="0" /></FormField>
          <FormField label="Harga Jual"><input type="number" className="input" {...f('selling_price')} min="0" /></FormField>
          <FormField label="Stok Awal"><input type="number" className="input" {...f('current_stock')} min="0" /></FormField>
          <FormField label="Reorder Point"><input type="number" className="input" {...f('reorder_point')} min="0" /></FormField>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_raw_material} onChange={e => setForm({...form, is_raw_material: e.target.checked})} className="rounded" />
          <span className="text-surface-600 dark:text-surface-400">Bahan baku (untuk produksi)</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  )
}

function AdjustStockModal({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ quantity: '', movement_type: 'IN', notes: '' })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await inventoryApi.adjustStock(product.id, { ...form, quantity: parseFloat(form.quantity) })
      toast.success('Stok berhasil disesuaikan')
      setForm({ quantity: '', movement_type: 'IN', notes: '' })
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={!!product} onClose={onClose} title={`Sesuaikan Stok · ${product?.name}`} size="sm">
      <p className="text-sm text-surface-500 mb-4">Stok saat ini: <strong>{parseFloat(product?.current_stock || 0).toFixed(2)} {product?.unit}</strong></p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Tipe Pergerakan" required>
          <select className="input" value={form.movement_type} onChange={e => setForm({...form, movement_type: e.target.value})}>
            {['IN','OUT','RETURN','DAMAGE','ADJUSTMENT'].map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Jumlah" required>
          <input type="number" className="input" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} min="0.01" step="0.01" required />
        </FormField>
        <FormField label="Keterangan">
          <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Alasan penyesuaian..." />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  )
}

function EditProductModal({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    if (product) setForm({
      sku: product.sku || '', name: product.name || '',
      unit: product.unit || 'pcs', unit_cost: product.unit_cost || '',
      selling_price: product.selling_price || '',
      minimum_stock: product.minimum_stock || '0',
      reorder_point: product.reorder_point || '0',
      is_raw_material: product.is_raw_material || false,
      is_active: product.is_active !== false
    })
  }, [product])

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm({...form, [k]: e.target.value}) })

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await inventoryApi.updateProduct(product.id, form)
      toast.success('Produk berhasil diupdate'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={!!product} onClose={onClose} title={`Edit Produk · ${product?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="SKU" required><input className="input" {...f('sku')} required /></FormField>
          <FormField label="Satuan" required>
            <select className="input" {...f('unit')}>
              {['pcs','kg','gram','liter','ml','meter','unit','box','karton'].map(u => <option key={u}>{u}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Nama Produk" required><input className="input" {...f('name')} required /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Harga Beli"><input type="number" className="input" {...f('unit_cost')} min="0" /></FormField>
          <FormField label="Harga Jual"><input type="number" className="input" {...f('selling_price')} min="0" /></FormField>
          <FormField label="Stok Minimum"><input type="number" className="input" {...f('minimum_stock')} min="0" /></FormField>
          <FormField label="Reorder Point"><input type="number" className="input" {...f('reorder_point')} min="0" /></FormField>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.is_raw_material} onChange={e => setForm({...form, is_raw_material: e.target.checked})} className="rounded" />
            <span className="text-surface-600 dark:text-surface-400">Bahan baku</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded" />
            <span className="text-surface-600 dark:text-surface-400">Aktif</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  )
}
