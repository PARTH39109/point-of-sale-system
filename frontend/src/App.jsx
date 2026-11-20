import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute, RoleRouter, ROLES } from './routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import BranchManagement from './pages/admin/BranchManagement'
import EmployeeManagement from './pages/admin/EmployeeManagement'
import AccessRequests from './pages/admin/AccessRequests'

import CategoryManagement from './pages/admin/CategoryManagement'
import ProductManagement from './pages/admin/ProductManagement'
import CustomerManagement from './pages/admin/CustomerManagement'
import CashierTerminal from './pages/cashier/CashierTerminal'
import InvoicePreview from './pages/cashier/InvoicePreview'
import CashierOrderHistory from './pages/cashier/CashierOrderHistory'
import CashierReturns from './pages/cashier/CashierReturns'
import CashierCustomers from './pages/cashier/CashierCustomers'
import CashierShiftSummary from './pages/cashier/CashierShiftSummary'
import RefundManagement from './pages/admin/RefundManagement'
import BusinessIntelligenceDashboard from './pages/admin/BusinessIntelligenceDashboard'
import EnterpriseReports from './pages/admin/EnterpriseReports'
import EnterpriseSettings from './pages/admin/EnterpriseSettings'
import SubscriptionManagement from './pages/admin/SubscriptionManagement'
import PaymentsManagement from './pages/admin/PaymentsManagement'
import BranchDashboard from './pages/manager/BranchDashboard'
import BranchAnalytics from './pages/manager/BranchAnalytics'
import BranchOrders from './pages/manager/BranchOrders'
import BranchInventory from './pages/manager/BranchInventory'
import BranchLowStock from './pages/manager/BranchLowStock'
import BranchEmployees from './pages/manager/BranchEmployees'
import BranchReports from './pages/manager/BranchReports'
import ShiftReports from './pages/manager/ShiftReports'
import BranchSettings from './pages/manager/BranchSettings'

// ── Placeholder dashboard & pages for other roles ────────────────────────────

function PlaceholderPage({ name }) {
  return (
      <div className="card">
        <h2 className="card-title">{name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          This page ({name}) is scheduled for development in the upcoming phase.
        </p>
      </div>
  )
}

export default function App() {
  return (
      <Router>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Store Admin Panel Protected routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN]}>
              <AppLayout />
            </ProtectedRoute>
          }>

            <Route path="access-requests" element={<AccessRequests />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<BusinessIntelligenceDashboard />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="payments" element={<PaymentsManagement />} />
            {/* Catalog is now owned by the Branch Manager — only the platform
              super admin (ROLE_ADMIN) retains access here, Store Admin does not */}


            <Route path="products" element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <ProductManagement />
              </ProtectedRoute>
            } />

            <Route path="refunds" element={<RefundManagement />} />
            <Route path="reports" element={<EnterpriseReports />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="settings" element={<EnterpriseSettings />} />
            <Route path="payments" element={<PlaceholderPage name="Payments" />} />
          </Route>

          {/* Branch Manager Dashboard Protected routes */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.BRANCH_MANAGER, ROLES.STORE_MANAGER]}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BranchDashboard />} />
            <Route path="analytics" element={<BranchAnalytics />} />
            <Route path="orders" element={<BranchOrders />} />

            {/* Catalog — moved here from /admin per the new ownership model */}
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="products" element={<ProductManagement />} />

            <Route path="inventory" element={<BranchInventory />} />
            <Route path="low-stock" element={<BranchLowStock />} />
            <Route path="employees" element={<BranchEmployees />} />

            {/* Cashier access-request approvals for this branch */}
            <Route path="cashier-requests" element={<AccessRequests />} />

            <Route path="customers" element={<CustomerManagement />} />
            <Route path="refunds" element={<RefundManagement />} />
            <Route path="reports" element={<BranchReports />} />
            <Route path="shifts" element={<ShiftReports />} />
            <Route path="settings" element={<BranchSettings />} />
          </Route>

          {/* Cashier Terminal Route */}
          <Route path="/cashier" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.CASHIER]}>
              <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', padding: 32 }}>
                <CashierTerminal />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/cashier/invoice/:orderId" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.CASHIER]}>
              <InvoicePreview />
            </ProtectedRoute>
          } />
          <Route path="/cashier/orders" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.CASHIER]}>
              <CashierOrderHistory />
            </ProtectedRoute>
          } />
          <Route path="/cashier/returns" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.CASHIER]}>
              <CashierReturns />
            </ProtectedRoute>
          } />
          <Route path="/cashier/customers" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.CASHIER]}>
              <CashierCustomers />
            </ProtectedRoute>
          } />
          <Route path="/cashier/shift" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STORE_ADMIN, ROLES.CASHIER]}>
              <CashierShiftSummary />
            </ProtectedRoute>
          } />

          {/* Default catch-all / root route */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleRouter />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
  )
}