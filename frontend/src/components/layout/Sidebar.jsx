import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  ShoppingCart, ChevronLeft, ChevronRight, LogOut, User,
  LayoutDashboard, GitBranch, Users, Package,
  Tag, BarChart2, Settings, Bell, CreditCard, ShoppingBag,
  RotateCcw, UserCheck, Boxes, AlertTriangle, ClipboardList,
  TrendingUp, Building2, Layers, UserPlus,
} from 'lucide-react'
import { selectUser } from '../../store/slices/authSlice'
import { logout } from '../../store/slices/authSlice'
import { toggleSidebar, selectSidebarCollapsed } from '../../store/slices/uiSlice'

// ── Navigation configs per role ───────────────────────────────────────────────
const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard'          },
      { to: '/admin/analytics',     icon: TrendingUp,      label: 'Analytics'          },
    ],
  },
  {
    section: 'Management',
    items: [
      { to: '/admin/branches',      icon: Building2,       label: 'Branches'           },
      { to: '/admin/employees',     icon: UserCheck,       label: 'Employees'          },
      { to: '/admin/access-requests', icon: UserPlus,      label: 'Access Requests'    },
    ],
  },
  {
    section: 'Finance',
    items: [
      { to: '/admin/subscriptions', icon: Layers,          label: 'Subscriptions'      },
      { to: '/admin/payments',      icon: CreditCard,      label: 'Payments'           },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/admin/settings',      icon: Settings,        label: 'Settings'           },
    ],
  },
]

const MANAGER_NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/manager/dashboard',   icon: LayoutDashboard, label: 'Dashboard'          },
      { to: '/manager/analytics',   icon: BarChart2,       label: 'Analytics'          },
    ],
  },
  { section: 'Catalog', items: [
      { to: '/manager/categories', icon: Tag, label: 'Categories' },
      { to: '/manager/products', icon: Package, label: 'Products' },
    ]},
  {
    section: 'Operations',
    items: [
      { to: '/manager/orders',      icon: ShoppingBag,     label: 'Orders'             },
      { to: '/manager/inventory',   icon: Boxes,           label: 'Inventory'          },
      { to: '/manager/low-stock',   icon: AlertTriangle,   label: 'Low Stock', badge: true },
    ],
  },

  { section: 'People', items: [
      { to: '/manager/employees', icon: UserCheck, label: 'Employees' },
      { to: '/manager/cashier-requests', icon: UserPlus, label: 'Cashier Requests' },
      { to: '/manager/customers', icon: Users, label: 'Customers' },
    ]},
  {
    section: 'Reports',
    items: [
      { to: '/manager/reports',     icon: ClipboardList,   label: 'Reports'            },
      { to: '/manager/shifts',      icon: RotateCcw,       label: 'Shift Reports'      },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/manager/settings',    icon: Settings,        label: 'Settings'           },
    ],
  },
]

const CASHIER_NAV = [
  {
    section: 'Terminal',
    items: [
      { to: '/cashier',             icon: ShoppingCart,    label: 'Cashier Terminal'   },
      { to: '/cashier/orders',      icon: ShoppingBag,     label: 'Order History'      },
      { to: '/cashier/refunds',     icon: RotateCcw,       label: 'Refunds'            },
    ],
  },
]

function getNavByRole(role) {
  if (role === 'ROLE_ADMIN' || role === 'ROLE_STORE_ADMIN') return ADMIN_NAV
  if (role === 'ROLE_BRANCH_MANAGER' || role === 'ROLE_STORE_MANAGER') return MANAGER_NAV
  return CASHIER_NAV
}

function getRoleLabel(role) {
  const map = {
    ROLE_ADMIN:          'Super Admin',
    ROLE_STORE_ADMIN:    'Store Admin',
    ROLE_BRANCH_MANAGER: 'Branch Manager',
    ROLE_STORE_MANAGER:  'Store Manager',
    ROLE_CASHIER:        'Cashier',
  }
  return map[role] || 'Staff'
}

// ── Sidebar Component ─────────────────────────────────────────────────────────
export default function Sidebar() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const user       = useSelector(selectUser)
  const collapsed  = useSelector(selectSidebarCollapsed)

  const navSections = getNavByRole(user?.role)
  const initials    = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo-icon">
            <ShoppingCart size={18} color="white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
              <div className="sidebar-logo-text">
                <span className="sidebar-logo-title">POS System</span>
                <span className="sidebar-logo-sub">Enterprise Edition</span>
              </div>
          )}
          <button
              onClick={() => dispatch(toggleSidebar())}
              className="btn btn-ghost btn-icon btn-sm"
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{ marginLeft: 'auto', flexShrink: 0 }}
          >
            {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
              <div key={section.section} className="nav-section">
                {!collapsed && (
                    <div className="nav-section-label">{section.section}</div>
                )}
                {section.items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to.split('/').length <= 2}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={18} className="nav-item-icon" />
                      {!collapsed && (
                          <>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.badge && (
                                <span className="nav-item-badge">!</span>
                            )}
                          </>
                      )}
                    </NavLink>
                ))}
              </div>
          ))}
        </nav>

        {/* Footer: User Profile */}
        <div className="sidebar-footer">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 4px', borderRadius: 'var(--radius-md)',
          }}>
            <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>
              {initials}
            </div>
            {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.fullName || 'User'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {getRoleLabel(user?.role)}
                  </div>
                </div>
            )}
            <button
                onClick={handleLogout}
                className="btn btn-ghost btn-icon btn-sm"
                title="Logout"
                style={{ color: 'var(--danger-text)', flexShrink: 0 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
  )
}