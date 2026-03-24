import { useEffect, useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { invoiceApi, salesApi } from '../../api/services'
import { PageLoader, StatusBadge, Pagination, SearchInput, Modal, FormField, Table, EmptyState } from '../../components/common'
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/helpers'

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { loadInvoices() }, [page, search, statusFilter])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const { data } = await invoiceApi.getInvoices({ page, limit: 20, search, status: statusFilter || undefined })
      setInvoices(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const handleSend = async (id) => {
    setActionLoading(id)
    try { await invoiceApi.sendInvoice(id); toast.success('Invoice dikirim'); loadInvoices() }
    catch (err) { toast.error(getErrorMessage(err)) } finally { setActionLoading(null) }
  }

  const STATUSES = ['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE']

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Invoice</h1><p className="text-sm text-surface-500">Tagihan dan pembayaran pelanggan</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Invoice Baru
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Cari invoice..." />
          <div className="flex gap-1">
            {STATUSES.map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'}`}>
                {s || 'Semua'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <PageLoader /> : (
          <>
            <Table>
              <thead><tr>
                <th>No. Invoice</th><th>Pelanggan</th><th>Tanggal</th><th>Jatuh Tempo</th>
                <th>Total</th><th>Sisa Tagihan</th><th>Status</th><th>Aksi</th>
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs font-medium">{inv.invoice_number}</td>
                    <td>{inv.customer_name}</td>
                    <td>{formatDate(inv.invoice_date)}</td>
                    <td className={inv.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''}>{formatDate(inv.due_date)}</td>
                    <td className="font-medium">{formatCurrency(inv.total_amount)}</td>
                    <td className={parseFloat(inv.balance_due) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {formatCurrency(inv.balance_due)}
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td className="space-x-2">
                      {inv.status === 'DRAFT' && (
                        <button onClick={() => handleSend(inv.id)} disabled={actionLoading === inv.id} className="text-xs text-blue-600 hover:underline">Kirim</button>
                      )}
                      {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
                        <button onClick={() => setShowPayment(inv)} className="text-xs text-green-600 hover:underline">Catat Bayar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={8}><EmptyState icon={FileText} title="Belum ada invoice" /></td></tr>}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <CreateInvoiceModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadInvoices() }} />
      <RecordPaymentModal invoice={showPayment} onClose={() => setShowPayment(null)} onSuccess={() => { setShowPayment(null); loadInvoices() }} />
    </div>
  )
}

function CreateInvoiceModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: '', invoice_date: new Date().toISOString().slice(0,10),
    due_date: '', tax_rate: '11', discount_amount: '0',
    items: [{ description: '', quantity: '1', unit_price: '' }]
  })

  useEffect(() => {
    if (open) salesApi.getCustomers({ limit: 100 }).then(r => setCustomers(r.data.data || [])).catch(() => {})
  }, [open])

  const updateItem = (i, k, v) => { const items = [...form.items]; items[i] = { ...items[i], [k]: v }; setForm({ ...form, items }) }
  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: '1', unit_price: '' }] })
  const removeItem = (i) => form.items.length > 1 && setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0)
  const tax = subtotal * (parseFloat(form.tax_rate) || 0) / 100
  const total = subtotal + tax - (parseFloat(form.discount_amount) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await invoiceApi.createInvoice({ ...form, customer_id: parseInt(form.customer_id), tax_rate: parseFloat(form.tax_rate), discount_amount: parseFloat(form.discount_amount) || 0, items: form.items.map(i => ({ ...i, quantity: parseFloat(i.quantity), unit_price: parseFloat(i.unit_price) })) })
      toast.success('Invoice berhasil dibuat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Buat Invoice Baru" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Pelanggan" required>
            <select className="input" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required>
              <option value="">Pilih pelanggan</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Tanggal Invoice" required>
            <input type="date" className="input" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} required />
          </FormField>
          <FormField label="Jatuh Tempo" required>
            <input type="date" className="input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
          </FormField>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Item Invoice</label>
            <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:underline">+ Tambah item</button>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-6"><input placeholder="Keterangan item" className="input text-xs" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required /></div>
              <div className="col-span-2"><input type="number" placeholder="Qty" className="input text-xs" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="0.01" step="0.01" required /></div>
              <div className="col-span-3"><input type="number" placeholder="Harga" className="input text-xs" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} min="0" required /></div>
              <div className="col-span-1 flex items-center justify-center">
                <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="PPN (%)"><input type="number" className="input" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} min="0" max="100" /></FormField>
          <FormField label="Diskon (Rp)"><input type="number" className="input" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: e.target.value })} min="0" /></FormField>
        </div>

        <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-surface-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-surface-500">PPN {form.tax_rate}%</span><span>{formatCurrency(tax)}</span></div>
          <div className="flex justify-between"><span className="text-surface-500">Diskon</span><span>-{formatCurrency(parseFloat(form.discount_amount) || 0)}</span></div>
          <div className="flex justify-between font-bold pt-1 border-t border-surface-200 dark:border-surface-700"><span>Total</span><span className="text-primary-600">{formatCurrency(total)}</span></div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Buat Invoice</button>
        </div>
      </form>
    </Modal>
  )
}

function RecordPaymentModal({ invoice, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ amount: '', payment_date: new Date().toISOString().slice(0,10), payment_method: 'TRANSFER', reference: '' })

  useEffect(() => { if (invoice) setForm(f => ({ ...f, amount: invoice.balance_due || '' })) }, [invoice])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await invoiceApi.recordPayment(invoice.id, { ...form, amount: parseFloat(form.amount) })
      toast.success('Pembayaran dicatat'); onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <Modal open={!!invoice} onClose={onClose} title={`Catat Pembayaran · ${invoice?.invoice_number}`} size="sm">
      <p className="text-sm text-surface-500 mb-4">Sisa tagihan: <strong className="text-red-600">{formatCurrency(invoice?.balance_due)}</strong></p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Jumlah Bayar" required><input type="number" className="input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="0.01" step="0.01" required /></FormField>
        <FormField label="Tanggal Bayar" required><input type="date" className="input" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} required /></FormField>
        <FormField label="Metode">
          <select className="input" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            {['TRANSFER', 'CASH', 'CHECK', 'GIRO'].map(m => <option key={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="No. Referensi"><input className="input" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="No. transfer / cek" /></FormField>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={loading} className="btn-primary">Catat Pembayaran</button>
        </div>
      </form>
    </Modal>
  )
}
