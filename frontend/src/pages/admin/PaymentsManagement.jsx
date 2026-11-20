import { useState, useEffect, useMemo } from 'react'
import { CreditCard, FileText, Download, Eye, X, Loader2, AlertCircle, Calendar } from 'lucide-react'
import subscriptionService from '../../services/subscriptionService'
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService'

const STATUS_OPTIONS = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED']
const DATE_OPTIONS = [
    { value: 'ALL', label: 'All Time' },
    { value: 'TODAY', label: 'Today' },
    { value: '7D', label: 'Last 7 Days' },
    { value: '30D', label: 'Last 30 Days' },
]

const formatCurrency = (amount, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount || 0)

export default function PaymentsManagement() {
    const [planData, setPlanData] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [statusFilter, setStatusFilter] = useState('ALL')
    const [dateFilter, setDateFilter] = useState('ALL')

    const [invoiceOpen, setInvoiceOpen] = useState(false)
    const [invoiceData, setInvoiceData] = useState(null)
    const [invoiceLoading, setInvoiceLoading] = useState(false)
    const [invoiceError, setInvoiceError] = useState('')

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const [planRes, historyRes] = await Promise.all([
                subscriptionService.getMyPlan(),
                subscriptionPaymentService.getHistory(),
            ])
            setPlanData(planRes.data)
            setHistory(historyRes.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load payment data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const lastPayment = useMemo(() =>
        history.find(h => h.status === 'SUCCESS') || null, [history])

    const totalPaid = useMemo(() =>
        history.filter(h => h.status === 'SUCCESS').reduce((sum, h) => sum + (h.amount || 0), 0), [history])

    const filtered = useMemo(() => {
        return history.filter(h => {
            if (statusFilter !== 'ALL' && h.status !== statusFilter) return false
            if (dateFilter === 'ALL') return true
            const created = new Date(h.createdAt)
            const now = new Date()
            const days = (now - created) / (1000 * 60 * 60 * 24)
            if (dateFilter === 'TODAY') return created.toDateString() === now.toDateString()
            if (dateFilter === '7D') return days <= 7
            if (dateFilter === '30D') return days <= 30
            return true
        })
    }, [history, statusFilter, dateFilter])

    const openInvoice = async (invoiceNumber) => {
        setInvoiceOpen(true)
        setInvoiceLoading(true)
        setInvoiceError('')
        setInvoiceData(null)
        try {
            const res = await subscriptionPaymentService.getInvoice(invoiceNumber)
            setInvoiceData(res.data)
        } catch (err) {
            setInvoiceError(err.response?.data?.message || 'Failed to load invoice')
        } finally {
            setInvoiceLoading(false)
        }
    }

    const downloadInvoice = async (invoiceNumber) => {
        try {
            const res = await subscriptionPaymentService.downloadInvoicePdf(invoiceNumber)
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
            const a = document.createElement('a')
            a.href = url
            a.download = `${invoiceNumber}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to download invoice')
        }
    }

    const statusBadgeClass = (status) => {
        if (status === 'SUCCESS') return 'badge-success'
        if (status === 'PENDING') return 'badge-warning'
        if (status === 'FAILED') return 'badge-danger'
        return 'badge-neutral'
    }

    if (loading && !planData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Payments</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Billing history and invoices for your subscription</p>
            </div>

            {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)' }}>
                    <AlertCircle size={16} />{error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid-cols-4">
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}><CreditCard size={20} color="white" /></div>
                    <div className="stat-card-value">{planData?.planName}</div>
                    <div className="stat-card-label">Current Plan</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: planData?.status === 'ACTIVE' ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#dc2626,#f87171)' }}>
                        <FileText size={20} color="white" />
                    </div>
                    <div className="stat-card-value">{planData?.status}</div>
                    <div className="stat-card-label">Subscription Status</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}><Calendar size={20} color="white" /></div>
                    <div className="stat-card-value">{lastPayment ? new Date(lastPayment.paidAt).toLocaleDateString() : '—'}</div>
                    <div className="stat-card-label">Last Payment</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}><Calendar size={20} color="white" /></div>
                    <div className="stat-card-value">{planData?.renewalDate ? new Date(planData.renewalDate).toLocaleDateString() : '—'}</div>
                    <div className="stat-card-label">Next Renewal</div>
                </div>
            </div>

            <div className="stat-card" style={{ maxWidth: 280 }}>
                <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}><CreditCard size={20} color="white" /></div>
                <div className="stat-card-value">{formatCurrency(totalPaid)}</div>
                <div className="stat-card-label">Total Amount Paid</div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Status</label>
                        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <select className="input" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                            {DATE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Payment History Table */}
            <div className="table-container">
                {filtered.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Invoice</th><th>Plan</th><th>Amount</th><th>Gateway</th><th>Status</th>
                                <th>Payment Method</th><th>Payment ID</th><th>Order ID</th><th>Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map(h => (
                                <tr key={h.id}>
                                    <td style={{ fontWeight: 600 }}>{h.invoiceNumber || '—'}</td>
                                    <td>{h.planName}</td>
                                    <td>{formatCurrency(h.amount, h.currency)}</td>
                                    <td>{h.gatewayName || 'RAZORPAY'}</td>
                                    <td><span className={`badge ${statusBadgeClass(h.status)}`}>{h.status}</span></td>
                                    <td style={{ textTransform: 'capitalize' }}>{h.paymentMethod || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.razorpayPaymentId || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.razorpayOrderId || '—'}</td>
                                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {h.status === 'SUCCESS' ? (
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-secondary btn-sm btn-icon" title="View Invoice" onClick={() => openInvoice(h.invoiceNumber)}>
                                                    <Eye size={14} />
                                                </button>
                                                <button className="btn btn-secondary btn-sm btn-icon" title="Download Invoice" onClick={() => downloadInvoice(h.invoiceNumber)}>
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                        ) : <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>—</span>}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><CreditCard size={32} /></div>
                        <h3 className="empty-state-title">No payments found</h3>
                        <p className="empty-state-desc">No payments match the selected filters.</p>
                    </div>
                )}
            </div>

            {/* Invoice Modal */}
            {invoiceOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 460 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Invoice</h3>
                            <button onClick={() => setInvoiceOpen(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                        </div>

                        {invoiceLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" size={28} color="var(--brand-400)" /></div>
                        ) : invoiceError ? (
                            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13 }}>{invoiceError}</div>
                        ) : invoiceData && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                                <Row label="Invoice Number" value={invoiceData.invoiceNumber} />
                                <Row label="Store" value={invoiceData.storeName} />
                                <Row label="Owner" value={invoiceData.storeOwnerName} />
                                <Row label="Email" value={invoiceData.storeOwnerEmail} />
                                <Row label="Plan" value={invoiceData.planName} />
                                <Row label="Billing Period" value={`${new Date(invoiceData.billingPeriodStart).toLocaleDateString()} – ${new Date(invoiceData.billingPeriodEnd).toLocaleDateString()}`} />
                                <Row label="Payment Method" value={invoiceData.paymentMethod} />
                                <Row label="Transaction ID" value={invoiceData.razorpayPaymentId} />
                                <Row label="Payment Date" value={new Date(invoiceData.paidAt).toLocaleDateString()} />
                                <Row label="Status" value={invoiceData.status} />
                                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                    <span>Amount Paid</span>
                                    <span>{formatCurrency(invoiceData.amount, invoiceData.currency)}</span>
                                </div>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setInvoiceOpen(false)}>Close</button>
                            {invoiceData && (
                                <button className="btn btn-primary" onClick={() => downloadInvoice(invoiceData.invoiceNumber)}>
                                    <Download size={14} /> Download PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 500 }}>{value || '—'}</span>
        </div>
    )
}