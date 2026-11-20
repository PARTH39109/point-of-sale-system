import { useState, useEffect } from 'react'
import biService from '../../services/businessIntelligenceService'
import {
  TrendingUp, BarChart2, DollarSign, Users, ShoppingBag, AlertCircle, RefreshCw, Box
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'

export default function BusinessIntelligenceDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('month') // today, week, month, year

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await biService.getDashboardAnalytics(range)
      setData(res.data)
    } catch (err) {
      console.error(err)
      const status = err?.response?.status
      if (!status || status >= 500 || status === 401 || status === 403) {
        setError(err?.response?.data?.message || 'Failed to load analytics.')
      } else {
        setData({})
      }
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
        <h3>Unable to load analytics</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: 4 }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    )
  }

  const isEmptyData = data && (!data.todayRevenue && !data.weeklyRevenue && !data.monthlyRevenue && !data.ordersToday && !data.ordersThisMonth)

  if (isEmptyData) {
    return (
      <div className="empty-state card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div className="empty-state-icon" style={{ margin: '0 auto 16px auto', width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={32} color="var(--brand-400)" />
        </div>
        <h3 className="empty-state-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
          No analytics data yet
        </h3>
        <p className="empty-state-desc" style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px auto' }}>
          Analytics will become available once your store starts processing sales.
        </p>
      </div>
    )
  }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="stat-card">
      <div className="stat-card-header">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-icon" style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 8 }}>
          <Icon size={20} color="var(--text-secondary)" />
        </div>
      </div>
      <div className="stat-card-value">
        {typeof value === 'number' && title.includes('Revenue') ? `₹${value.toLocaleString('en-IN')}` : value}
      </div>
      {(trend !== undefined || subtitle) && (
        <div className="stat-card-trend">
          {trend !== undefined && (
            <span style={{ color: trend >= 0 ? 'var(--success-text)' : 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={14} style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} />
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          <span style={{ color: 'var(--text-tertiary)' }}>{subtitle}</span>
        </div>
      )}
    </div>
  )

  const paymentData = [
    { name: 'Cash', value: data.cashPercent },
    { name: 'Card', value: data.cardPercent },
    { name: 'UPI', value: data.upiPercent },
    { name: 'Wallet', value: data.walletPercent },
    { name: 'Split', value: data.splitPercent }
  ].filter(p => p.value > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Global Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Business Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enterprise-wide Analytics & Live KPIs</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-elevated)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          {['today', 'week', 'month', 'year'].map(r => (
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

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <StatCard title="Total Revenue" value={data.todayRevenue} subtitle="vs previous period" trend={data.revenueGrowthPercent} icon={DollarSign} />
        <StatCard title="Total Orders" value={data.ordersToday} subtitle="completed orders" icon={ShoppingBag} />
        <StatCard title="Avg Order Value" value={data.averageOrderValue} subtitle="across all branches" icon={BarChart2} />
        <StatCard title="New Customers" value={data.newCustomers || 0} subtitle="acquired in period" icon={Users} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        
        {/* Main Temporal Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue & Volume Trend</div>
            <div className="card-subtitle">Aggregated daily performance</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} 
                tickFormatter={(val) => {
                  if (!val) return '';
                  const d = new Date(val);
                  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                }}
              />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Payment Distribution</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={paymentData} cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                paddingAngle={2} dataKey="value" nameKey="name"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--bg-surface)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        
        {/* Peak Hours Heatmap Prep */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Peak Sales Hours</div>
            <div className="card-subtitle">Busiest operational times</div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.peakSalesHours}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={h => `${h}:00`} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cashiers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Cashiers</div>
            <div className="card-subtitle">Employee performance</div>
          </div>
          <div className="table-wrapper" style={{ maxHeight: 250, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCashiers?.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td style={{ textAlign: 'right' }}>{c.orders}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{c.revenue?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Revenue */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue by Category</div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
             <BarChart data={data.revenuePerCategory} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
