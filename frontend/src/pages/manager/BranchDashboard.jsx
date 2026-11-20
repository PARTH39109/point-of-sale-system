import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from '../../store/slices/authSlice'
import analyticsService from '../../services/analyticsService'
import {
  TrendingUp, ShoppingBag, CreditCard, Users, Package,
  AlertTriangle, RotateCcw, UserCheck, Boxes, ArrowUpRight,
  ArrowDownRight, Minus, RefreshCw, BarChart2
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── KPI Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, subtitle, isAlert = false }) {
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

export default function BranchDashboard() {
  const user = useSelector(selectUser)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('week')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsService.getBranchDashboard(range)
      setData(res.data)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.message || err.message || 'Failed to load dashboard data.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [range])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} color="var(--danger-text)" style={{ marginBottom: 16 }} />
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: 16 }}>
          <RefreshCw size={16} /> Retry
        </button>
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
            Welcome, {user?.fullName}! 👋
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Here's what's happening at your branch.
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
        <StatCard icon={CreditCard} label="Today's Sales" value={`₹${data.todaySales?.toLocaleString('en-IN')}`} color="blue" subtitle="Gross Revenue" />
        <StatCard icon={TrendingUp} label="Weekly Sales" value={`₹${data.weeklySales?.toLocaleString('en-IN')}`} color="green" subtitle="Gross Revenue" />
        <StatCard icon={BarChart2} label="Monthly Sales" value={`₹${data.monthlySales?.toLocaleString('en-IN')}`} color="purple" subtitle="Gross Revenue" />
        <StatCard icon={ShoppingBag} label="Orders Today" value={data.ordersToday} color="blue" subtitle="Completed orders" />
        <StatCard icon={CreditCard} label="Avg Order Value" value={`₹${data.avgOrderValue?.toLocaleString('en-IN')}`} color="green" subtitle="This period" />
        <StatCard icon={Users} label="Customers" value={data.totalCustomers} color="purple" subtitle="Unique customers" />
        <StatCard icon={UserCheck} label="Active Employees" value={data.activeEmployees} color="indigo" subtitle="At this branch" />
        
        <StatCard icon={AlertTriangle} label="Low Stock" value={data.lowStockProducts} color={data.lowStockProducts > 0 ? "amber" : "green"} subtitle="Needs attention" isAlert={data.lowStockProducts > 0} />
        <StatCard icon={Boxes} label="Out of Stock" value={data.outOfStockProducts} color={data.outOfStockProducts > 0 ? "red" : "green"} subtitle="Critical" isAlert={data.outOfStockProducts > 0} />
        <StatCard icon={RotateCcw} label="Pending Refunds" value={data.pendingRefunds} color="amber" subtitle="Awaiting processing" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Sales Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Trend</div>
              <div className="card-subtitle">Last 30 days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.dailyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.20}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left"  tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left"  type="monotone" dataKey="revenue"  name="revenue"  stroke="#3b82f6" strokeWidth={2}
                fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
              <Area yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#34d399" strokeWidth={2}
                fill="url(#ordersGrad)" dot={false} activeDot={{ r: 5, fill: '#34d399' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Payment Methods</div>
              <div className="card-subtitle">Revenue distribution</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.paymentBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="total" nameKey="method"
              >
                {data.paymentBreakdown?.map((entry, index) => (
                  <Cell key={entry.method} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
                borderRadius: 8, fontSize: 13,
              }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {data.paymentBreakdown?.map((p, index) => (
              <div key={p.method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{p.method}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{p.total.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
         {/* Top Products */}
         <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Products</div>
              <div className="card-subtitle">By units sold</div>
            </div>
          </div>
          <div className="table-wrapper">
             <table>
               <thead>
                 <tr>
                   <th>#</th>
                   <th>Product</th>
                   <th>Units</th>
                   <th>Revenue</th>
                 </tr>
               </thead>
               <tbody>
                 {data.topProducts?.map((p, i) => (
                   <tr key={p.productName}>
                     <td>{i + 1}</td>
                     <td>{p.productName}</td>
                     <td>{p.unitsSold}</td>
                     <td>₹{p.revenue.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
                 {!data.topProducts?.length && (
                   <tr>
                     <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
                       No data available
                     </td>
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
              <div className="card-title">Recent Orders</div>
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
                {data.recentOrders?.map(row => (
                  <tr key={row.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand-400)' }}>{row.orderNumber}</span></td>
                    <td>{row.customerName}</td>
                    <td><strong>₹{row.grandTotal.toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`badge ${
                        row.orderStatus === 'COMPLETED' || row.orderStatus === 'DELIVERED' ? 'badge-success' :
                        row.orderStatus === 'PENDING'   ? 'badge-warning' :
                        row.orderStatus === 'CANCELLED' ? 'badge-danger' :
                        row.orderStatus === 'REFUNDED' || row.orderStatus === 'PARTIALLY_REFUNDED' ? 'badge-info' : 'badge-neutral'
                      }`}>
                        <span className="badge-dot" />
                        {row.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.recentOrders?.length && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>
                      No recent orders
                    </td>
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
