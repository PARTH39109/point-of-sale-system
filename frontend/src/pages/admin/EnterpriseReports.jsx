import { useState } from 'react'
import { FileText, Download, BarChart2, ShoppingBag, CreditCard, Users, Building2, Box, RefreshCw } from 'lucide-react'
import reportingService from '../../services/reportingService'

function exportToCSV(data, filename) {
  if (!data || !data.length) {
    alert("No data available to export.")
    return
  }
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(','))
  const csv = [headers, ...rows].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ReportCard({ title, description, icon: Icon, type }) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await reportingService.getReport(type, 'year')
      exportToCSV(res.data, `enterprise_${type}_report`)
    } catch (err) {
      console.error(err)
      alert(`Failed to export ${title}. Check console for details.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
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
      <button 
        className="btn btn-secondary" 
        onClick={handleExport}
        disabled={loading}
        style={{ width: '100%', marginTop: 'auto' }}
      >
        {loading ? <RefreshCw size={16} className="spin" /> : <Download size={16} />} 
        {loading ? 'Generating...' : 'Export CSV'}
      </button>
    </div>
  )
}

export default function EnterpriseReports() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Reports</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate and download consolidated business intelligence reports</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <ReportCard 
          title="Enterprise Sales" 
          description="Consolidated daily revenue and order volumes."
          icon={BarChart2} 
          type="sales" 
        />
        <ReportCard 
          title="Branch Performance" 
          description="Revenue and order counts across all branches."
          icon={Building2} 
          type="branches" 
        />
        <ReportCard 
          title="Category Performance" 
          description="Revenue and volume aggregated by product category."
          icon={Box} 
          type="categories" 
        />
        <ReportCard 
          title="Global Inventory" 
          description="Stock levels, valuation, and low stock alerts."
          icon={Box} 
          type="inventory" 
        />
        <ReportCard 
          title="Consolidated Payments" 
          description="Payment method breakdown and gateway volume."
          icon={CreditCard} 
          type="payments" 
        />
        <ReportCard 
          title="Top Products" 
          description="Best selling items enterprise-wide."
          icon={ShoppingBag} 
          type="products" 
        />
        <ReportCard 
          title="Customer Roster" 
          description="Customer list with loyalty point distributions."
          icon={Users} 
          type="customers" 
        />
        <ReportCard 
          title="Employee Roster" 
          description="Complete list of staff, roles, and assignments."
          icon={Users} 
          type="employees" 
        />
        <ReportCard 
          title="Refunds Register" 
          description="History of all cancelled and refunded orders."
          icon={FileText} 
          type="refunds" 
        />
      </div>
      
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="var(--brand-400)" />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Advanced Exports</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Excel (.xlsx) and PDF export capabilities are architecturally prepared for the next major release.</div>
          </div>
        </div>
      </div>

    </div>
  )
}
