import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectUser } from '../../store/slices/authSlice'
import analyticsService from '../../services/analyticsService'
import {
  TrendingUp, TrendingDown, Store, Users, ShoppingBag,
  CreditCard, BarChart2, Package, Building2, Activity,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, AlertTriangle,
  Plus, Settings, ChevronRight, CheckCircle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── KPI Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, subtitle, isAlert }) {
  const iconBg = {
    blue:   'linear-gradient(135deg,#2563eb,#3b82f6)',
    green:  'linear-gradient(135deg,#059669,#34d399)',
    purple: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
    amber:  'linear-gradient(135deg,#d97706,#fbbf24)',
    red:    'linear-gradient(135deg,#dc2626,#f87171)',
    indigo: 'linear-gradient(135deg,#4338ca,#818cf8)',
  }

  return (
    <div className={`stat-card ${isAlert ? 'error' : ''}`}>
      <div className="stat-card-icon" style={{ background: iconBg[color] || iconBg.blue }}>
        <Icon size={22} color="white" />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  )
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text-secondary)', display: 'flex', gap: 8 }}>
          <span style={{ color: 'var(--text-tertiary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {p.name === 'revenue' ? `₹${(p.value/1000).toFixed(1)}K` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const user = useSelector(selectUser)
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('month') // today | week | month

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsService.getEnterpriseDashboard(range)
      setData(res.data)
    } catch (err) {
      console.error(err)
      // Only treat genuine server/network failures as errors.
      // HTTP 200 with empty data is handled via the isNewStore check below.
      const status = err?.response?.status
      if (!status || status >= 500 || status === 401 || status === 403) {
        setError(err?.response?.data?.message || 'Failed to load enterprise dashboard data.')
      } else {
        // Non-fatal (e.g. 404 on a truly empty store) — treat as empty data
        setData({})
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [range])

  // ── Detect a brand-new store with no activity yet ──────────────────────────
  const isNewStore = data !== null && !error &&
    (data.totalOrders === 0 || data.totalOrders == null) &&
    (data.activeBranches === 0 || data.activeBranches == null)

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    )
  }

  // ── Genuine server/network error ───────────────────────────────────────────
  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} color="var(--danger-text)" style={{ marginBottom: 16 }} />
        <h3>Unable to load dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: 4 }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  // ── Brand-new store onboarding ─────────────────────────────────────────────
  if (isNewStore) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--bg-elevated) 100%)',
          border: '1px solid var(--border-brand)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 36px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(139,92,246,0.06)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            👋 Welcome to your store, {user?.fullName?.split(' ')[0]}!
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 0 }}>
            Your POS system is set up and ready. Follow the steps below to start accepting sales.
          </div>
        </div>

        {/* Onboarding Steps */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Get started in 3 steps
          </div>

          {[
            {
              step: 1,
              icon: Building2,
              title: 'Create your first branch',
              desc: 'A branch is a physical store location where sales happen. Start by creating at least one.',
              action: 'Create Branch',
              path: '/admin/branches',
              color: '#3b82f6',
            },
            {
              step: 2,
              icon: Users,
              title: 'Add your first employee',
              desc: 'Add branch managers and cashiers so your team can start managing operations.',
              action: 'Add Employee',
              path: '/admin/employees',
              color: '#10b981',
            },
            {
              step: 3,
              icon: Settings,
              title: 'Configure store settings',
              desc: 'Set up your receipt, subscription plan, and store-wide preferences.',
              action: 'Go to Settings',
              path: '/admin/settings',
              color: '#8b5cf6',
            },
          ].map(({ step, icon: Icon, title, desc, action, path, color }) => (
            <div
              key={step}
              style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '18px 0',
                borderBottom: step < 3 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}18`,
              }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3 }}>
                  Step {step}: {title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(path)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {action} <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Stats — all zeros, informational */}
        <div className="grid-cols-4">
          {[
            { icon: Building2, label: 'Branches', value: '0', color: 'blue' },
            { icon: Users,     label: 'Employees', value: '0', color: 'green' },
            { icon: Package,   label: 'Products', value: '0', color: 'purple' },
            { icon: ShoppingBag, label: 'Orders', value: '0', color: 'amber' },
          ].map(({ icon: Icon, label, value, color }) => (
            <StatCard key={label} icon={Icon} label={label} value={value} color={color} />
          ))}
        </div>
      </div>
    )
  }

  const CHART_COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--border-brand)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(59,130,246,0.08)', pointerEvents: 'none' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Enterprise Dashboard
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Overview of all stores and branches for {user?.fullName}.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['today','week','month'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-secondary'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm btn-icon" onClick={fetchData} title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid-cols-4">
        <StatCard icon={CreditCard} label="Total Revenue (All Time)" value={`₹${data.totalRevenue?.toLocaleString('en-IN') || 0}`} color="blue" subtitle="Lifetime Gross" />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={`₹${data.monthlyRevenue?.toLocaleString('en-IN') || 0}`} color="green" subtitle="This Month" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={data.totalOrders || 0} color="purple" subtitle="Period Total" />
        <StatCard icon={Activity} label="Avg Order Value" value={`₹${data.avgOrderValue?.toLocaleString('en-IN') || 0}`} color="blue" subtitle="Period Average" />
        
        <StatCard icon={Users} label="Total Customers" value={data.totalCustomers || 0} color="indigo" subtitle="Unique across network" />
        <StatCard icon={Building2} label="Active Branches" value={data.activeBranches || 0} color="amber" subtitle="Currently operational" />
        <StatCard icon={Package} label="Total Products" value={data.totalProducts || 0} color="green" subtitle="Catalog size" />
        <StatCard icon={Store} label="Total Employees" value={data.totalEmployees || 0} color="purple" subtitle="Across all branches" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Sales Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Enterprise Revenue Trend</div>
              <div className="card-subtitle">Aggregated across all branches (Last 30 days)</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.dailyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Branches */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Performing Branches</div>
              <div className="card-subtitle">By revenue</div>
            </div>
          </div>
          <div className="table-wrapper">
             <table>
               <thead>
                 <tr>
                   <th>Branch</th>
                   <th>Revenue</th>
                 </tr>
               </thead>
               <tbody>
                 {data.topBranches?.map((b, i) => (
                   <tr key={b.branchName}>
                     <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <div style={{ width: 6, height: 6, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                           {b.branchName}
                        </div>
                     </td>
                     <td style={{ fontWeight: 600 }}>₹{b.revenue?.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
                 {!data.topBranches?.length && (
                   <tr>
                     <td colSpan="2" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>No branch data</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
         {/* Top Products */}
         <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Enterprise Products</div>
              <div className="card-subtitle">Across all branches</div>
            </div>
          </div>
          <div className="table-wrapper">
             <table>
               <thead>
                 <tr>
                   <th>#</th>
                   <th>Product</th>
                   <th>Units Sold</th>
                   <th>Revenue</th>
                 </tr>
               </thead>
               <tbody>
                 {data.topProducts?.slice(0, 5).map((p, i) => (
                   <tr key={p.productName}>
                     <td>{i + 1}</td>
                     <td>{p.productName}</td>
                     <td>{p.unitsSold}</td>
                     <td style={{ fontWeight: 600 }}>₹{p.revenue.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
                 {!data.topProducts?.length && (
                   <tr>
                     <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>No product data</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Network Orders</div>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders?.slice(0, 5).map(row => (
                  <tr key={row.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand-400)' }}>{row.orderNumber}</span></td>
                    <td>{row.customerName}</td>
                    <td><strong>₹{row.grandTotal.toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`badge ${
                        row.orderStatus === 'COMPLETED' || row.orderStatus === 'DELIVERED' ? 'badge-success' :
                        row.orderStatus === 'PENDING'   ? 'badge-warning' :
                        row.orderStatus === 'CANCELLED' ? 'badge-danger' : 'badge-info'
                      }`}>
                        <span className="badge-dot" />
                        {row.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.recentOrders?.length && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>No recent orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
