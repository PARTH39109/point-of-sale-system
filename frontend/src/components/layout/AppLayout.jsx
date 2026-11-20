import { useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { selectSidebarCollapsed } from '../../store/slices/uiSlice'

// Map route segments to human-readable page titles
const PAGE_TITLES = {
  dashboard:     { title: 'Dashboard',          subtitle: 'Overview & key metrics' },
  analytics:     { title: 'Analytics',          subtitle: 'Sales & performance data' },
  stores:        { title: 'Store Management',   subtitle: 'Manage all stores' },
  branches:      { title: 'Branch Management',  subtitle: 'Manage branch locations' },
  employees:     { title: 'Employees',          subtitle: 'Staff management' },
  customers:     { title: 'Customers',          subtitle: 'Customer directory' },
  categories:    { title: 'Categories',         subtitle: 'Product categories' },
  products:      { title: 'Products',           subtitle: 'Product catalog' },
  inventory:     { title: 'Inventory',          subtitle: 'Stock management' },
  'low-stock':   { title: 'Low Stock Alerts',   subtitle: 'Products below threshold' },
  orders:        { title: 'Orders',             subtitle: 'Order management' },
  payments:      { title: 'Payments',           subtitle: 'Payment records' },
  refunds:       { title: 'Refunds',            subtitle: 'Refund management' },
  reports:       { title: 'Reports',            subtitle: 'Business reports' },
  shifts:        { title: 'Shift Reports',      subtitle: 'Daily shift summaries' },
  subscriptions: { title: 'Subscriptions',      subtitle: 'Plan & billing management' },
  settings:      { title: 'Settings',           subtitle: 'System configuration' },
  profile:       { title: 'My Profile',         subtitle: 'Account settings' },
}

export default function AppLayout() {
  const collapsed = useSelector(selectSidebarCollapsed)
  const location  = useLocation()

  // Get last segment of path for title lookup
  const segment = location.pathname.split('/').filter(Boolean).pop() || 'dashboard'
  const pageInfo = PAGE_TITLES[segment] || { title: 'POS System', subtitle: '' }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
