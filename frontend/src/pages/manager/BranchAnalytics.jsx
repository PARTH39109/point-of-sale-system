import { useEffect, useState } from 'react'
import analyticsService from '../../services/analyticsService'
import {
  TrendingUp, BarChart2, CreditCard, Users, RefreshCw, Loader2, AlertCircle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

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
            {p.name === 'revenue' || p.name === 'total' 
              ? `₹${p.value.toLocaleString('en-IN')}` 
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function BranchAnalytics() {
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
      const msg = err.response?.data?.message || err.message || 'Failed to load analytics data.'
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
        <AlertCircle size={48} color="var(--danger-text)" style={{ marginBottom: 16 }} />
        <h3>Error loading analytics</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: 16 }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  const CHART_COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171']
  
  // Format top products for bar chart (reverse to show highest at top when layout=vertical)
  const topProductsChart = data.topProducts ? [...data.topProducts].reverse() : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Deep dive into your branch performance metrics</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-elevated)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          {['today', 'week', 'month'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-md)' }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>
            <TrendingUp size={20} color="white" />
          </div>
          <div className="stat-card-value">₹{(range === 'today' ? data.todaySales : range === 'month' ? data.monthlySales : data.weeklySales)?.toLocaleString('en-IN') || 0}</div>
          <div className="stat-card-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#059669,#34d399)' }}>
            <BarChart2 size={20} color="white" />
          </div>
          <div className="stat-card-value">{range === 'today' ? data.ordersToday : range === 'month' ? data.ordersMonth : data.ordersWeek}</div>
          <div className="stat-card-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}>
            <CreditCard size={20} color="white" />
          </div>
          <div className="stat-card-value">₹{data.avgOrderValue?.toLocaleString('en-IN') || 0}</div>
          <div className="stat-card-label">Avg Order Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
            <Users size={20} color="white" />
          </div>
          <div className="stat-card-value">{data.totalCustomers || 0}</div>
          <div className="stat-card-label">Unique Customers</div>
        </div>
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Revenue Area Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue & Orders Trend</div>
              <div className="card-subtitle">Last 30 days performance</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.dailyRevenue} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} 
                tickFormatter={(val) => {
                  if (!val) return '';
                  const d = new Date(val);
                  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                }}
              />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" strokeWidth={3}
                fill="url(#salesGrad)" dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: 'var(--bg-surface)', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Payment Methods</div>
              <div className="card-subtitle">Volume breakdown</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.paymentBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                paddingAngle={2} dataKey="count" nameKey="method"
              >
                {data.paymentBreakdown?.map((entry, index) => (
                  <Cell key={entry.method} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--bg-surface)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value} orders (₹${props.payload.total.toLocaleString('en-IN')})`, name]} 
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }} 
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Horizontal Bar Chart: Top Products */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Products by Volume</div>
              <div className="card-subtitle">Highest moving items in selected period</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsChart} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="productName" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} 
                tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
              />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="unitsSold" name="Units" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20}>
                {topProductsChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === topProductsChart.length - 1 ? '#60a5fa' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Stats Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue by Method</div>
              <div className="card-subtitle">Detailed payment collection</div>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentBreakdown?.map((p, i) => {
                  const totalRev = data.paymentBreakdown.reduce((sum, item) => sum + item.total, 0)
                  const percent = totalRev > 0 ? ((p.total / totalRev) * 100).toFixed(1) : 0
                  return (
                    <tr key={p.method}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span style={{ fontWeight: 600 }}>{p.method}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.count}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{p.total.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>{percent}%</td>
                    </tr>
                  )
                })}
                {!data.paymentBreakdown?.length && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>No payment data</td>
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
