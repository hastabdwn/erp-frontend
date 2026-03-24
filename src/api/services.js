import api from './client'

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login:          (data)       => api.post('/auth/login', data),
  logout:         ()           => api.post('/auth/logout'),
  profile:        ()           => api.get('/auth/profile'),
  changePassword: (data)       => api.patch('/auth/change-password', data),
  refreshToken:   (data)       => api.post('/auth/refresh-token', data),
}

// ── Dashboard ─────────────────────────────────────
export const dashboardApi = {
  getSummary:       (period=30) => api.get(`/dashboard?period=${period}`),
  getFinancial:     ()          => api.get('/dashboard/widgets/financial'),
  getSalesWidget:   ()          => api.get('/dashboard/widgets/sales'),
  getInventoryWidget: ()        => api.get('/dashboard/widgets/inventory'),
}

// ── Settings ──────────────────────────────────────
export const settingsApi = {
  getCompany:        ()         => api.get('/settings/company'),
  updateCompany:     (data)     => api.put('/settings/company', data),
  getPreferences:    ()         => api.get('/settings/preferences'),
  updatePreferences: (data)     => api.put('/settings/preferences', data),
  getUsers:          (params)   => api.get('/settings/users', { params }),
  createUser:        (data)     => api.post('/settings/users', data),
  updateUser:        (id, data) => api.put(`/settings/users/${id}`, data),
  resetPassword:     (id, data) => api.patch(`/settings/users/${id}/reset-password`, data),
  getAccounts:       (params)   => api.get('/settings/accounts', { params }),
  createAccount:     (data)     => api.post('/settings/accounts', data),
  getDepartments:    ()         => api.get('/settings/departments'),
  createDepartment:  (data)     => api.post('/settings/departments', data),
}

// ── Finance ───────────────────────────────────────
export const financeApi = {
  getJournals:        (params)  => api.get('/finance/journals', { params }),
  getJournal:         (id)      => api.get(`/finance/journals/${id}`),
  createJournal:      (data)    => api.post('/finance/journals', data),
  postJournal:        (id)      => api.post(`/finance/journals/${id}/post`),
  getIncomeStatement: (params)  => api.get('/finance/reports/income-statement', { params }),
  getBalanceSheet:    (params)  => api.get('/finance/reports/balance-sheet', { params }),
  getBankRecon:       (params)  => api.get('/finance/reports/bank-reconciliation', { params }),
}

// ── Invoice ───────────────────────────────────────
export const invoiceApi = {
  getInvoices:   (params)    => api.get('/invoices', { params }),
  getInvoice:    (id)        => api.get(`/invoices/${id}`),
  createInvoice: (data)      => api.post('/invoices', data),
  sendInvoice:   (id)        => api.post(`/invoices/${id}/send`),
  recordPayment: (id, data)  => api.post(`/invoices/${id}/payment`, data),
}

// ── Inventory ─────────────────────────────────────
export const inventoryApi = {
  getProducts:   (params)    => api.get('/inventory/products', { params }),
  getLowStock:   ()          => api.get('/inventory/products/low-stock'),
  getProduct:    (id)        => api.get(`/inventory/products/${id}`),
  createProduct: (data)      => api.post('/inventory/products', data),
  updateProduct: (id, data)  => api.put(`/inventory/products/${id}`, data),
  deleteProduct: (id)        => api.delete(`/inventory/products/${id}`),
  adjustStock:   (id, data)  => api.post(`/inventory/products/${id}/adjust-stock`, data),
  getMovements:  (params)    => api.get('/inventory/movements', { params }),
}

// ── Purchases ─────────────────────────────────────
export const purchaseApi = {
  getSuppliers:    (params)   => api.get('/purchases/suppliers', { params }),
  createSupplier:  (data)     => api.post('/purchases/suppliers', data),
  getPRs:          (params)   => api.get('/purchases/requisitions', { params }),
  createPR:        (data)     => api.post('/purchases/requisitions', data),
  approvePR:       (id, data) => api.patch(`/purchases/requisitions/${id}/approve`, data),
  getPOs:          (params)   => api.get('/purchases/orders', { params }),
  getPOById:       (id)       => api.get(`/purchases/orders/${id}`),
  createPO:        (data)     => api.post('/purchases/orders', data),
  approvePO:       (id, data) => api.patch(`/purchases/orders/${id}/approve`, data),
  receiveGoods:    (id, data) => api.post(`/purchases/orders/${id}/receive`, data),
}

// ── Sales ─────────────────────────────────────────
export const salesApi = {
  getCustomers:   (params)   => api.get('/sales/customers', { params }),
  createCustomer: (data)     => api.post('/sales/customers', data),
  updateCustomer: (id, data) => api.put(`/sales/customers/${id}`, data),
  getOrders:      (params)   => api.get('/sales/orders', { params }),
  getAnalytics:   (params)   => api.get('/sales/orders/analytics', { params }),
  getOrder:       (id)       => api.get(`/sales/orders/${id}`),
  createOrder:    (data)     => api.post('/sales/orders', data),
  confirmOrder:   (id)       => api.post(`/sales/orders/${id}/confirm`),
  shipOrder:      (id, data) => api.post(`/sales/orders/${id}/ship`, data),
  cancelOrder:    (id, data) => api.patch(`/sales/orders/${id}/cancel`, data),
}

// ── Production ────────────────────────────────────
export const productionApi = {
  getBOMs:         (params)   => api.get('/production/bom', { params }),
  getBOM:          (id)       => api.get(`/production/bom/${id}`),
  createBOM:       (data)     => api.post('/production/bom', data),
  getWorkOrders:   (params)   => api.get('/production/work-orders', { params }),
  createWorkOrder: (data)     => api.post('/production/work-orders', data),
  startProduction: (id)       => api.post(`/production/work-orders/${id}/start`),
  completeProduction: (id, data) => api.post(`/production/work-orders/${id}/complete`, data),
}

// ── HR ────────────────────────────────────────────
export const hrApi = {
  getEmployees:      (params)   => api.get('/hr/employees', { params }),
  getEmployee:       (id)       => api.get(`/hr/employees/${id}`),
  createEmployee:    (data)     => api.post('/hr/employees', data),
  updateEmployee:    (id, data) => api.put(`/hr/employees/${id}`, data),
  getAttendance:     (params)   => api.get('/hr/attendance', { params }),
  recordAttendance:  (data)     => api.post('/hr/attendance', data),
  getLeaves:         (params)   => api.get('/hr/leaves', { params }),
  submitLeave:       (data)     => api.post('/hr/leaves', data),
  approveLeave:      (id, data) => api.patch(`/hr/leaves/${id}/approve`, data),
}

// ── Payroll ───────────────────────────────────────
export const payrollApi = {
  getList:        (params)   => api.get('/payroll', { params }),
  createRun:      (data)     => api.post('/payroll', data),
  approve:        (id)       => api.post(`/payroll/${id}/approve`),
  process:        (id, data) => api.post(`/payroll/${id}/process`, data),
  getPayslip:     (params)   => api.get('/payroll/payslip', { params }),
  deleteRun:      (id)       => api.delete(`/payroll/${id}`),
}

// ── Activity Logs ─────────────────────────────────
export const logsApi = {
  getLogs:   (params) => api.get('/activity-logs', { params }),
  getStats:  (params) => api.get('/activity-logs/stats', { params }),
  getLog:    (id)     => api.get(`/activity-logs/${id}`),
}
