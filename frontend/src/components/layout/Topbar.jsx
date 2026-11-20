import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings, Sun, Moon } from 'lucide-react'
import { selectUser } from '../../store/slices/authSlice'
import { logout } from '../../store/slices/authSlice'
import { toggleMobileSidebar, selectSidebarCollapsed } from '../../store/slices/uiSlice'

// ── Theme hook — persisted in localStorage ────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pos-theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('pos-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return { theme, toggle }
}

export default function Topbar({ title, subtitle }) {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const user      = useSelector(selectUser)
  const collapsed = useSelector(selectSidebarCollapsed)
  const { theme, toggle: toggleTheme } = useTheme()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
      {/* Left */}
      <div className="topbar-left">
        {/* Mobile menu toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => dispatch(toggleMobileSidebar())}
          id="topbar-mobile-menu"
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>

        <div>
          {title && <h1 className="topbar-title">{title}</h1>}
          {subtitle && <p className="topbar-breadcrumb">{subtitle}</p>}
        </div>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Search */}
        <button className="topbar-search" id="topbar-search" title="Search">
          <Search size={14} />
          <span>Search…</span>
          <kbd style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '1px 5px',
            fontFamily: 'var(--font-mono)',
          }}>⌘K</kbd>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            id="topbar-notifications"
            className="btn btn-ghost btn-icon"
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false) }}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={17} />
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--danger-text)',
              border: '1.5px solid var(--bg-surface)',
            }} />
          </button>

          {notifOpen && (
            <div className="dropdown-menu" style={{ minWidth: 300, right: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</div>
                <span className="badge badge-success" style={{ fontSize: 10 }}>New</span>
              </div>
              <div className="empty-state" style={{ padding: '28px 16px' }}>
                <div className="empty-state-icon" style={{ width: 40, height: 40, marginBottom: 10 }}>
                  <Bell size={16} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          id="topbar-theme-toggle"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light'
            ? <Moon size={16} />
            : <Sun size={16} />
          }
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 2px' }} />

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            id="topbar-user-menu"
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'transparent', border: '1px solid transparent',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              padding: '5px 10px 5px 6px',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <div className="avatar avatar-sm">{initials}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                {user?.fullName?.split(' ')[0] || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                {user?.email}
              </div>
            </div>
            <ChevronDown
              size={13}
              color="var(--text-tertiary)"
              style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {userMenuOpen && (
            <div className="dropdown-menu">
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>

              <button className="dropdown-item" onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}>
                <User size={14} /> My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}>
                <Settings size={14} /> Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside overlay */}
      {(userMenuOpen || notifOpen) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: -1 }}
          onClick={() => { setUserMenuOpen(false); setNotifOpen(false) }}
        />
      )}
    </header>
  )
}
