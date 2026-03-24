import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import FinancePage from './pages/finance/FinancePage'
import InvoicePage from './pages/invoice/InvoicePage'
import InventoryPage from './pages/inventory/InventoryPage'
import PurchasesPage from './pages/purchases/PurchasesPage'
import SalesPage from './pages/sales/SalesPage'
import ProductionPage from './pages/production/ProductionPage'
import HRPage from './pages/hr/HRPage'
import PayrollPage from './pages/payroll/PayrollPage'
import SettingsPage from './pages/settings/SettingsPage'
import LogsPage from './pages/logs/LogsPage'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated())
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid #3f3f46',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#18181b' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="finance"    element={<FinancePage />} />
          <Route path="invoices"   element={<InvoicePage />} />
          <Route path="inventory"  element={<InventoryPage />} />
          <Route path="purchases"  element={<PurchasesPage />} />
          <Route path="sales"      element={<SalesPage />} />
          <Route path="production" element={<ProductionPage />} />
          <Route path="hr"         element={<HRPage />} />
          <Route path="payroll"    element={<PayrollPage />} />
          <Route path="settings"   element={<SettingsPage />} />
          <Route path="logs"       element={<LogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
