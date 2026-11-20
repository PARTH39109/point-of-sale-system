import { useEffect, useState } from 'react'
import analyticsService from '../../services/analyticsService'
import {
  FileText, Download, BarChart2, ShoppingBag, 
  CreditCard, RotateCcw, Calendar, Loader2, AlertCircle
} from 'lucide-react'

// Simple CSV Export Utility
function exportCSV(data, filename) {
  if (!data || !data.length) return alert('No data to export')
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(r => Object.values(r).map(v => 
    typeof v === 'string' && v.includes(',') ? `"${v}"` : v
  ).join(','))
  const csv = [headers, ...rows].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ReportCard({ title, description, icon: Icon, data, onExport, loading }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} color="var(--brand-400)" />
          </div>
          <div>
            <div className="card-title">{title}</div>
            <div className="card-subtitle">{description}</div>
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
        {loading ? (
          <Loader2 className="spin" size={24} color="var(--text-tertiary)" />
        ) : !data || data.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No data available for selected period</div>
        ) : (
          <div style={{ padding: 16, width: '100%' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>Records: {data.length}</span>
                <span>Ready to export</span>
             </div>
             <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--brand-500)' }} />
             </div>
          </div>
        )}
      </div>

      <button 
        className="btn btn-secondary" 
        onClick={() => onExport(data)}
        disabled={loading || !data || data.length === 0}
        style={{ width: '100%' }}
      >
        <Download size={16} /> Export CSV
      </button>
    </div>
  )
}

export default function BranchReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState('month') // Default to month for reports

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsService.getBranchDashboard(range)
      setData(res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [range])

  // Prepare data for export
  const exportSales = (data) => {
    if (!data?.dailyRevenue) return
    const formatted = data.dailyRevenue.map(d => ({
      Date: d.date,
      Orders: d.orders,
      Revenue: d.revenue
    }))
    exportCSV(formatted, 'sales_report')
  }

  const exportProducts = (data) => {
    if (!data?.topProducts) return
    const formatted = data.topProducts.map((p, i) => ({
      Rank: i + 1,
      Product: p.productName,
      Units_Sold: p.unitsSold,
      Revenue: p.revenue
    }))
    exportCSV(formatted, 'top_products_report')
  }

  const exportPayments = (data) => {
    if (!data?.paymentBreakdown) return
    const totalRev = data.paymentBreakdown.reduce((sum, item) => sum + item.total, 0)
    const formatted = data.paymentBreakdown.map(p => ({
      Method: p.method,
      Transactions: p.count,
      Total_Amount: p.total,
      Percentage: totalRev > 0 ? ((p.total / totalRev) * 100).toFixed(2) + '%' : '0%'
    }))
    exportCSV(formatted, 'payment_methods_report')
  }

  const exportRecentOrders = (data) => {
    if (!data?.recentOrders) return
    const formatted = data.recentOrders.map(o => ({
      Order_Number: o.orderNumber,
      Date: o.createdAt,
      Customer: o.customerName || 'Walk-in',
      Status: o.orderStatus,
      Payment_Method: o.paymentMethod,
      Amount: o.grandTotal
    }))
    exportCSV(formatted, 'recent_orders_report')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Generate and download branch reports</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
            <Calendar size={16} /> Period:
          </div>
          <select className="input" value={range} onChange={e => setRange(e.target.value)} style={{ width: 150 }}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="empty-state" style={{ padding: 20 }}>
          <AlertCircle size={32} color="var(--danger-text)" style={{ marginBottom: 12 }} />
          <p>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <ReportCard 
          title="Sales Summary"
          description="Daily revenue and order volumes"
          icon={BarChart2}
          data={data?.dailyRevenue}
          onExport={() => exportSales(data)}
          loading={loading}
        />
        
        <ReportCard 
          title="Top Products"
          description="Best selling items by quantity"
          icon={ShoppingBag}
          data={data?.topProducts}
          onExport={() => exportProducts(data)}
          loading={loading}
        />
        
        <ReportCard 
          title="Payment Methods"
          description="Revenue breakdown by payment type"
          icon={CreditCard}
          data={data?.paymentBreakdown}
          onExport={() => exportPayments(data)}
          loading={loading}
        />
        
        <ReportCard 
          title="Recent Orders"
          description="Log of recent transactions"
          icon={FileText}
          data={data?.recentOrders}
          onExport={() => exportRecentOrders(data)}
          loading={loading}
        />
      </div>

    </div>
  )
}
