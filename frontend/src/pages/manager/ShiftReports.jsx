import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import {
    Clock, DollarSign, ShoppingBag, Users, XCircle, CreditCard,
    Eye, Printer, Download, X, Loader2, AlertCircle, TrendingUp, PackageX, RotateCcw
} from 'lucide-react';
import { shiftService } from '../../services/shiftService';
import { branchService } from '../../services/branchService';

const SHIFT_LABELS = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

const ShiftReports = () => {
    const user = useSelector(selectUser);
    const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_STORE_ADMIN';

    const [kpis, setKpis] = useState(null);
    const [shifts, setShifts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
    const [branchFilter, setBranchFilter] = useState('');
    const [shiftLabelFilter, setShiftLabelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [selectedShift, setSelectedShift] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { date: dateFilter || undefined };
            if (isAdmin && branchFilter) params.branchId = branchFilter;
            if (shiftLabelFilter) params.shiftLabel = shiftLabelFilter;
            if (statusFilter) params.status = statusFilter;

            const [kpiRes, shiftRes] = await Promise.all([
                shiftService.getKpis({ date: dateFilter || undefined, branchId: isAdmin ? (branchFilter || undefined) : undefined }),
                shiftService.getShifts(params),
            ]);
            setKpis(kpiRes.data);
            setShifts(shiftRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load shift reports');
        } finally {
            setLoading(false);
        }
    }, [dateFilter, branchFilter, shiftLabelFilter, statusFilter, isAdmin]);

    useEffect(() => {
        if (isAdmin) {
            branchService.getAllBranches().then(res => setBranches(res.data || [])).catch(() => {});
        }
    }, [isAdmin]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openDetails = async (shift) => {
        setSelectedShift({ ...shift, report: null });
        setReportLoading(true);
        setReportError('');
        try {
            const res = await shiftService.getShiftReport(shift.id);
            setSelectedShift({ ...shift, report: res.data });
        } catch (err) {
            setReportError(err.response?.data?.message || 'Failed to load shift report');
        } finally {
            setReportLoading(false);
        }
    };

    const closeDetails = () => setSelectedShift(null);

    const printReport = () => window.print();

    const exportCsv = () => {
        if (!selectedShift?.report) return;
        const r = selectedShift.report;
        const lines = [
            ['Shift Report'],
            ['Cashier', r.cashierName],
            ['Branch', r.branchName],
            ['Shift', r.shiftLabel],
            ['Opened', r.openedAt],
            ['Closed', r.closedAt || 'Active'],
            [],
            ['KPI', 'Value'],
            ['Total Orders', r.totalOrders],
            ['Cancelled Orders', r.cancelledOrders],
            ['Total Sales', r.totalSales],
            ['Items Sold', r.itemsSold],
            ['Discounts Given', r.totalDiscount],
            ['Average Bill Value', r.averageBillValue],
            [],
            ['Payment Method', 'Amount'],
            ...(r.paymentBreakdown || []).map(p => [p.method, p.amount]),
            [],
            ['Top Product', 'Qty Sold'],
            ...(r.topProducts || []).map(p => [p.productName, p.qtySold]),
            [],
            ['Cash Closing'],
            ['Opening Cash', r.openingCash],
            ['Cash Collected', r.cashCollected],
            ['Expected Cash', r.expectedCash],
            ['Actual Cash', r.actualCash ?? 'Pending'],
            ['Difference', r.cashDifference ?? '-'],
        ];
        const csv = lines.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shift-${r.shiftId}-report.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const kpiCards = kpis ? [
        { icon: Clock, label: 'Active Shifts', value: kpis.activeShifts, color: 'linear-gradient(135deg,#2563eb,#3b82f6)' },
        { icon: DollarSign, label: 'Total Sales Today', value: formatCurrency(kpis.totalSalesToday), color: 'linear-gradient(135deg,#059669,#34d399)' },
        { icon: ShoppingBag, label: 'Total Orders', value: kpis.totalOrders, color: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
        { icon: Users, label: 'Cashiers on Shift', value: kpis.cashiersOnShift, color: 'linear-gradient(135deg,#0891b2,#22d3ee)' },
        { icon: XCircle, label: 'Cancelled Orders', value: kpis.cancelledOrders, color: 'linear-gradient(135deg,#dc2626,#f87171)' },
        { icon: CreditCard, label: 'Payments Collected', value: formatCurrency(kpis.totalPaymentsCollected), color: 'linear-gradient(135deg,#d97706,#fbbf24)' },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Shift Reports</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {isAdmin ? 'Shift activity across every branch' : 'Shift activity for cashiers in your branch'}
                </p>
            </div>

            {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)' }}>
                    <AlertCircle size={16} />{error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid-cols-3">
                {kpiCards.map((k, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon" style={{ background: k.color }}><k.icon size={20} color="white" /></div>
                        <div className="stat-card-value">{k.value ?? '-'}</div>
                        <div className="stat-card-label">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Date</label>
                        <input type="date" className="input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                    </div>
                    {isAdmin && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Branch</label>
                            <select className="input" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Shift</label>
                        <select className="input" value={shiftLabelFilter} onChange={e => setShiftLabelFilter(e.target.value)}>
                            <option value="">All Shifts</option>
                            {SHIFT_LABELS.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Status</label>
                        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">Active / Completed</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Shift Table */}
            <div className="table-container">
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" size={32} color="var(--brand-400)" /></div>
                ) : shifts.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Cashier</th>
                                <th>Shift</th>
                                <th>Login</th>
                                <th>Logout</th>
                                <th>Duration</th>
                                <th>Orders</th>
                                <th>Sales</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {shifts.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.cashierName}</td>
                                    <td>{s.shiftLabel?.charAt(0) + s.shiftLabel?.slice(1).toLowerCase()}</td>
                                    <td>{new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{s.closedAt ? new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td>{s.durationLabel}</td>
                                    <td>{s.orderCount}</td>
                                    <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalSales)}</td>
                                    <td>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                        <span className="badge-dot" />{s.status === 'ACTIVE' ? 'Active' : 'Completed'}
                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => openDetails(s)}>
                                            <Eye size={13} /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><Clock size={32} /></div>
                        <h3 className="empty-state-title">No shifts found</h3>
                        <p className="empty-state-desc">No cashier shifts match the selected filters.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedShift && (
                <div className="modal-overlay">
                    <div className="modal modal-xl" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">{selectedShift.cashierName}'s Shift</h3>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedShift.branchName}</p>
                            </div>
                            <button onClick={closeDetails} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                        </div>

                        {reportLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" size={32} color="var(--brand-400)" /></div>
                        ) : reportError ? (
                            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 14, color: 'var(--danger-text)' }}>
                                {reportError}
                            </div>
                        ) : selectedShift.report && (
                            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Shift Performance */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                        Shift Performance
                                    </h4>
                                    <div className="grid-cols-3">
                                        <div className="stat-card"><div className="stat-card-value">{selectedShift.report.totalOrders}</div><div className="stat-card-label">Orders</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{formatCurrency(selectedShift.report.totalSales)}</div><div className="stat-card-label">Revenue</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{selectedShift.report.itemsSold}</div><div className="stat-card-label">Items Sold</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{selectedShift.report.returnsCount}</div><div className="stat-card-label">Returns</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{formatCurrency(selectedShift.report.totalDiscount)}</div><div className="stat-card-label">Discounts Given</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{formatCurrency(selectedShift.report.averageBillValue)}</div><div className="stat-card-label">Avg Bill Value</div></div>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                        Payment Breakdown
                                    </h4>
                                    {selectedShift.report.paymentBreakdown?.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {selectedShift.report.paymentBreakdown.map((p, i) => {
                                                const max = Math.max(...selectedShift.report.paymentBreakdown.map(x => x.amount || 0), 1);
                                                const pct = ((p.amount || 0) / max) * 100;
                                                return (
                                                    <div key={i}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                            <span style={{ fontWeight: 600 }}>{p.method}</span>
                                                            <span>{formatCurrency(p.amount)}</span>
                                                        </div>
                                                        <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-400)', borderRadius: 4 }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No payments recorded.</p>}
                                </div>

                                {/* Hourly Sales */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                        <TrendingUp size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Hourly Sales
                                    </h4>
                                    {selectedShift.report.hourlySales?.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {selectedShift.report.hourlySales.map((h, i) => {
                                                const max = Math.max(...selectedShift.report.hourlySales.map(x => x.sales || 0), 1);
                                                const pct = Math.max(((h.sales || 0) / max) * 100, 4);
                                                return (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 60, fontSize: 12, color: 'var(--text-tertiary)' }}>
                              {h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}
                            </span>
                                                        <div style={{ flex: 1, height: 16, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-400)', borderRadius: 4 }} />
                                                        </div>
                                                        <span style={{ width: 80, fontSize: 12, textAlign: 'right' }}>{formatCurrency(h.sales)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No hourly sales data.</p>}
                                </div>

                                {/* Top Products + Low Stock side by side */}
                                <div className="grid-cols-2">
                                    <div>
                                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                            Top Selling Products
                                        </h4>
                                        {selectedShift.report.topProducts?.length > 0 ? (
                                            <table>
                                                <thead><tr><th>Product</th><th style={{ textAlign: 'right' }}>Qty Sold</th></tr></thead>
                                                <tbody>
                                                {selectedShift.report.topProducts.map((p, i) => (
                                                    <tr key={i}><td>{p.productName}</td><td style={{ textAlign: 'right' }}>{p.qtySold}</td></tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No products sold.</p>}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                            <PackageX size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Low Stock (current)
                                        </h4>
                                        {selectedShift.report.lowStockItems?.length > 0 ? (
                                            <table>
                                                <thead><tr><th>Product</th><th style={{ textAlign: 'right' }}>Remaining</th></tr></thead>
                                                <tbody>
                                                {selectedShift.report.lowStockItems.map((p, i) => (
                                                    <tr key={i}><td>{p.productName}</td><td style={{ textAlign: 'right' }}>{p.remaining}</td></tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Nothing low on stock.</p>}
                                    </div>
                                </div>

                                {/* Returns */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                        <RotateCcw size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />Returns / Refunds
                                    </h4>
                                    {selectedShift.report.returns?.length > 0 ? (
                                        <table>
                                            <thead><tr><th>Bill</th><th>Customer</th><th>Reason</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                                            <tbody>
                                            {selectedShift.report.returns.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.billNumber}</td><td>{r.customerName}</td><td>{r.reason || '-'}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatCurrency(r.amount)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    ) : <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No returns during this shift.</p>}
                                </div>

                                {/* Shift Closing */}
                                <div>
                                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                                        Shift Closing
                                    </h4>
                                    <div className="grid-cols-3">
                                        <div className="stat-card"><div className="stat-card-value">{formatCurrency(selectedShift.report.openingCash)}</div><div className="stat-card-label">Opening Cash</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{formatCurrency(selectedShift.report.cashCollected)}</div><div className="stat-card-label">Cash Collected</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{formatCurrency(selectedShift.report.expectedCash)}</div><div className="stat-card-label">Expected Cash</div></div>
                                        <div className="stat-card"><div className="stat-card-value">{selectedShift.report.actualCash != null ? formatCurrency(selectedShift.report.actualCash) : 'Pending'}</div><div className="stat-card-label">Actual Cash</div></div>
                                        <div className="stat-card">
                                            <div className="stat-card-value" style={{ color: selectedShift.report.cashDifference < 0 ? 'var(--danger-text)' : selectedShift.report.cashDifference > 0 ? 'var(--warning-text)' : 'var(--success-text)' }}>
                                                {selectedShift.report.cashDifference != null ? formatCurrency(selectedShift.report.cashDifference) : '-'}
                                            </div>
                                            <div className="stat-card-label">Difference</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={printReport}><Printer size={14} /> Print Report</button>
                            <button className="btn btn-secondary" onClick={exportCsv}><Download size={14} /> Export Excel</button>
                            <button className="btn btn-primary" onClick={closeDetails}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftReports;