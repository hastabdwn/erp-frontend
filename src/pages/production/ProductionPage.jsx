import { useEffect, useState } from 'react'
import { Plus, Factory } from 'lucide-react'
import toast from 'react-hot-toast'
import { productionApi, inventoryApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatDate, getErrorMessage } from '../../utils/helpers'

export default function ProductionPage() {
  const [tab, setTab] = useState('wo')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showComplete, setShowComplete] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { load() }, [tab, page])

  const load = async () => {
    setLoading(true)
    try {
      const res = tab === 'wo'
        ? await productionApi.getWorkOrders({ page, limit: 20 })
        : await productionApi.getBOMs({ page, limit: 20 })
      setItems(res.data.data?.data || res.data.data || [])
      setTotalPages(res.data.data?.pagination?.total_pages || 1)
    } catch {} finally { setLoading(false) }
  }

  const handleStart = async (id) => {
    setActionLoading(id)
    try { await productionApi.startProduction(id); toast.success('Produksi dimulai, bahan baku dikonsumsi'); load() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Produksi</h1><p className="text-sm text-surface-500">Work Order dan Bill of Materials</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />{tab === 'wo' ? 'Work Order' : 'BOM Baru'}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit">
        {[['wo','Work Order'],['bom','Bill of Materials']].map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab===id?'bg-white dark:bg-surface-900 shadow-sm text-surface-900 dark:text-white':'text-surface-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <PageLoader /> : (
          <>
            {tab === 'wo' && (
              <Table>
                <thead><tr><th>No. WO</th><th>Produk</th><th>Qty</th><th>Deadline</th><th>Status</th><th>Terlambat</th><th>Aksi</th></tr></thead>
                <tbody>
                  {items.map(wo => (
                    <tr key={wo.id}>
                      <td className="font-mono text-xs font-medium">{wo.wo_number}</td>
                      <td>{wo.product_name}</td>
                      <td>{parseFloat(wo.quantity || 0).toLocaleString('id-ID')} {wo.unit}</td>
                      <td className={wo.is_overdue ? 'text-red-600 font-medium' : ''}>{formatDate(wo.deadline)}</td>
                      <td><StatusBadge status={wo.status} /></td>
                      <td>{wo.is_overdue ? <span className="text-xs text-red-600 font-medium">⚠ Terlambat</span> : '-'}</td>
                      <td className="space-x-2">
                        {wo.status === 'PENDING' && <button onClick={() => handleStart(wo.id)} disabled={actionLoading === wo.id} className="text-xs text-blue-600 hover:underline">Mulai</button>}
                        {wo.status === 'IN_PROGRESS' && <button onClick={() => setShowComplete(wo)} className="text-xs text-green-600 hover:underline">Selesaikan</button>}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={7}><EmptyState icon={Factory} title="Belum ada Work Order" /></td></tr>}
                </tbody>
              </Table>
            )}

            {tab === 'bom' && (
              <Table>
                <thead><tr><th>Produk</th><th>Qty Produksi</th><th>Jumlah Material</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map(bom => (
                    <tr key={bom.id}>
                      <td className="font-medium">{bom.product_name}</td>
                      <td>{parseFloat(bom.quantity_produced || 0).toLocaleString('id-ID')} {bom.unit}</td>
                      <td>{bom.material_count || 0} material</td>
                      <td><StatusBadge status={bom.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={4}><EmptyState icon={Factory} title="Belum ada BOM" /></td></tr>}
                </tbody>
              </Table>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      {tab === 'wo' && <CreateWOModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      {tab === 'bom' && <CreateBOMModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); load() }} />}
      <CompleteWOModal wo={showComplete} onClose={() => setShowComplete(null)} onSuccess={() => { setShowComplete(null); load() }} />
    </div>
  )
}

function CreateWOModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [boms, setBoms] = useState([])
  const [form, setForm] = useState({ product_id: '', bom_id: '', quantity: '', deadline: '', notes: '' })

  useEffect(() => {
    if (open) {
      inventoryApi.getProducts({ limit: 100 }).then(r => setProducts(r.data.data?.data || r.data.data || [])).catch(() => {})
      productionApi.getBOMs().then(r => setBoms(r.data.data?.data || r.data.data || [])).catch(() => {})
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await productionApi.createWorkOrder({ ...form, product_id: parseInt(form.product_id), bom_id: parseInt(form.bom_id), quantity: parseFloat(form.quantity) })
      toast.success('Work Order dibuat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Work Order">
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Produk" required>
          <select className="input" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
            <option value="">Pilih produk</option>
            {products.filter(p => !p.is_raw_material).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <FormField label="BOM" required>
          <select className="input" value={form.bom_id} onChange={e => setForm({ ...form, bom_id: e.target.value })} required>
            <option value="">Pilih BOM</option>
            {boms.map(b => <option key={b.id} value={b.id}>{b.product_name} (x{b.quantity_produced})</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quantity" required><input type="number" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} min="0.01" step="0.01" required /></FormField>
          <FormField label="Deadline" required><input type="datetime-local" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required /></FormField>
        </div>
        <FormField label="Catatan"><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormField>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Buat WO</button></div>
      </form>
    </Modal>
  )
}

function CompleteWOModal({ wo, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ actual_quantity: '', defect_quantity: '0', qc_notes: '', labor_cost: '0', overhead_cost: '0' })
  useEffect(() => { if (wo) setForm(f => ({ ...f, actual_quantity: wo.quantity || '' })) }, [wo])
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await productionApi.completeProduction(wo.id, { ...form, actual_quantity: parseFloat(form.actual_quantity), defect_quantity: parseFloat(form.defect_quantity) || 0, labor_cost: parseFloat(form.labor_cost) || 0, overhead_cost: parseFloat(form.overhead_cost) || 0 })
      toast.success('Produksi selesai, stok barang jadi bertambah'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }
  return (
    <Modal open={!!wo} onClose={onClose} title={`Selesaikan Produksi · ${wo?.wo_number}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Qty Aktual" required><input type="number" className="input" value={form.actual_quantity} onChange={e => setForm({ ...form, actual_quantity: e.target.value })} min="0" step="0.01" required /></FormField>
          <FormField label="Qty Cacat"><input type="number" className="input" value={form.defect_quantity} onChange={e => setForm({ ...form, defect_quantity: e.target.value })} min="0" step="0.01" /></FormField>
          <FormField label="Biaya Tenaga Kerja"><input type="number" className="input" value={form.labor_cost} onChange={e => setForm({ ...form, labor_cost: e.target.value })} min="0" /></FormField>
          <FormField label="Biaya Overhead"><input type="number" className="input" value={form.overhead_cost} onChange={e => setForm({ ...form, overhead_cost: e.target.value })} min="0" /></FormField>
        </div>
        <FormField label="Catatan QC"><textarea className="input" rows={2} value={form.qc_notes} onChange={e => setForm({ ...form, qc_notes: e.target.value })} /></FormField>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Selesaikan</button></div>
      </form>
    </Modal>
  )
}

function CreateBOMModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ product_id: '', quantity_produced: '1', materials: [{ material_id: '', quantity: '', unit: 'kg', scrap_pct: '0' }] })

  useEffect(() => {
    if (open) inventoryApi.getProducts({ limit: 100 }).then(r => setProducts(r.data.data?.data || r.data.data || [])).catch(() => {})
  }, [open])

  const updateMat = (i, k, v) => { const m = [...form.materials]; m[i] = { ...m[i], [k]: v }; setForm({ ...form, materials: m }) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await productionApi.createBOM({ ...form, product_id: parseInt(form.product_id), quantity_produced: parseFloat(form.quantity_produced), materials: form.materials.map(m => ({ ...m, material_id: parseInt(m.material_id), quantity: parseFloat(m.quantity), scrap_pct: parseFloat(m.scrap_pct) || 0 })) })
      toast.success('BOM berhasil dibuat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Bill of Materials" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Produk Jadi" required>
            <select className="input" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
              <option value="">Pilih produk</option>
              {products.filter(p => !p.is_raw_material).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Qty Produksi"><input type="number" className="input" value={form.quantity_produced} onChange={e => setForm({ ...form, quantity_produced: e.target.value })} min="0.01" step="0.01" /></FormField>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Material</label>
            <button type="button" onClick={() => setForm({ ...form, materials: [...form.materials, { material_id: '', quantity: '', unit: 'kg', scrap_pct: '0' }] })} className="text-xs text-primary-600 hover:underline">+ Tambah</button>
          </div>
          {form.materials.map((mat, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 mb-2">
              <select className="input text-xs col-span-2" value={mat.material_id} onChange={e => updateMat(i, 'material_id', e.target.value)} required>
                <option value="">Pilih bahan baku</option>
                {products.filter(p => p.is_raw_material).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Qty" className="input text-xs" value={mat.quantity} onChange={e => updateMat(i, 'quantity', e.target.value)} min="0.001" step="0.001" required />
              <input type="number" placeholder="Scrap %" className="input text-xs" value={mat.scrap_pct} onChange={e => updateMat(i, 'scrap_pct', e.target.value)} min="0" max="100" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-secondary">Batal</button><button type="submit" disabled={loading} className="btn-primary">Simpan BOM</button></div>
      </form>
    </Modal>
  )
}
