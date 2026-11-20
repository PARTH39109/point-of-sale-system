import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { Menu, Clock, Clock3, ShoppingBag, TrendingUp, Wallet, RefreshCcw, Play, Square } from 'lucide-react';
import { shiftService } from '../../services/shiftService';
import CashierNavDrawer from './CashierNavDrawer';
import './CashierTerminal.css';
import './CashierShell.css';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

const CashierShiftSummary = () => {
    const user = useSelector(selectUser);
    const [navOpen, setNavOpen] = useState(false);
    const [currentTime] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeShift, setActiveShift] = useState(null);
    const [report, setReport] = useState(null);

    const [startModalOpen, setStartModalOpen] = useState(false);
    const [openingCash, setOpeningCash] = useState('');
    const [endModalOpen, setEndModalOpen] = useState(false);
    const [closingCash, setClosingCash] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const loadShift = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await shiftService.getActiveShift();
            setActiveShift(res.data);
            if (res.data) {
                const reportRes = await shiftService.getShiftReport(res.data.id);
                setReport(reportRes.data);
            } else {
                setReport(null);
            }
        } catch (err) {
            setError('Could not load your shift.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadShift(); }, []);

    const handleStartShift = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setActionError('');
        try {
            await shiftService.startShift({ openingCash: openingCash ? Number(openingCash) : 0 });
            setStartModalOpen(false);
            setOpeningCash('');
            await loadShift();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to start shift.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndShift = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setActionError('');
        try {
            await shiftService.endShift(activeShift.id, { closingCashActual: closingCash ? Number(closingCash) : 0 });
            setEndModalOpen(false);
            setClosingCash('');
            await loadShift();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to end shift.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="pos-shell cashier-page">
            <CashierNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

            <header className="pos-topbar">
                <div className="pos-topbar-left">
                    <button className="cashier-hamburger" onClick={() => setNavOpen(true)} aria-label="Open menu">
                        <Menu className="w-4 h-4" />
                    </button>
                    <div className="pos-brand">
                        <div className="pos-brand-mark">POS</div>
                        <span className="pos-brand-title">My Shift</span>
                    </div>
                </div>
                <div className="pos-topbar-right">
                    <div className="pos-clock pos-figure">
                        <Clock className="w-3.5 h-3.5" style={{ color: 'var(--brand-400)' }} />
                        <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </header>

            <div className="cashier-page-body">
                <div className="cashier-page-header">
                    <div>
                        <div className="cashier-page-title">My Shift</div>
                        <div className="cashier-page-subtitle">{user?.fullName || 'Cashier'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="pos-action-btn" style={{ width: 'auto', padding: '0 16px' }} onClick={loadShift}>
                            <RefreshCcw className="w-4 h-4" /> Refresh
                        </button>
                        {activeShift ? (
                            <button className="pos-action-btn" style={{ width: 'auto', padding: '0 16px', background: 'var(--danger-bg)', color: 'var(--danger-text)' }} onClick={() => setEndModalOpen(true)}>
                                <Square className="w-4 h-4" /> End Shift
                            </button>
                        ) : (
                            <button className="pos-action-btn" style={{ width: 'auto', padding: '0 16px', background: 'var(--brand-400)', color: 'white' }} onClick={() => setStartModalOpen(true)}>
                                <Play className="w-4 h-4" /> Start Shift
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="cashier-loading">Loading your shift...</div>
                ) : !activeShift ? (
                    <div className="cashier-empty">
                        <Clock3 className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto' }} />
                        <h3>No active shift</h3>
                        <p>Start a shift to begin billing and tracking your sales.</p>
                    </div>
                ) : error ? (
                    <div className="cashier-empty">
                        <Clock3 className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto' }} />
                        <h3>{error}</h3>
                    </div>
                ) : report && (
                    <>
                        <div className="cashier-stat-row">
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Total Sales</div>
                                <div className="cashier-stat-value brand pos-figure">{formatCurrency(report.totalSales)}</div>
                            </div>
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Orders Completed</div>
                                <div className="cashier-stat-value pos-figure">{report.totalOrders}</div>
                            </div>
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Items Sold</div>
                                <div className="cashier-stat-value pos-figure">{report.itemsSold}</div>
                            </div>
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Avg. Order Value</div>
                                <div className="cashier-stat-value pos-figure">{formatCurrency(report.averageBillValue)}</div>
                            </div>
                        </div>

                        <div className="cashier-page-title" style={{ fontSize: 15, marginBottom: 12 }}>Payment Method Breakdown</div>
                        {report.paymentBreakdown?.length === 0 ? (
                            <div className="cashier-empty">
                                <Wallet className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto' }} />
                                <h3>No sales yet this shift</h3>
                            </div>
                        ) : (
                            <div className="cashier-stat-row" style={{ marginBottom: 24 }}>
                                {report.paymentBreakdown.map((p) => (
                                    <div key={p.method} className="cashier-stat-card">
                                        <div className="cashier-stat-label">{p.method}</div>
                                        <div className="cashier-stat-value pos-figure" style={{ fontSize: 20 }}>{formatCurrency(p.amount)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="cashier-page-title" style={{ fontSize: 15, marginBottom: 12 }}>
                            <ShoppingBag className="w-4 h-4" style={{ display: 'inline', marginRight: 6, verticalAlign: -3 }} />
                            Cash Reconciliation (running)
                        </div>
                        <div className="cashier-stat-row">
                            <div className="cashier-stat-card"><div className="cashier-stat-label">Opening Cash</div><div className="cashier-stat-value pos-figure">{formatCurrency(report.openingCash)}</div></div>
                            <div className="cashier-stat-card"><div className="cashier-stat-label">Cash Collected</div><div className="cashier-stat-value pos-figure">{formatCurrency(report.cashCollected)}</div></div>
                            <div className="cashier-stat-card"><div className="cashier-stat-label">Expected Cash</div><div className="cashier-stat-value pos-figure">{formatCurrency(report.expectedCash)}</div></div>
                        </div>
                    </>
                )}
            </div>

            {/* Start Shift Modal */}
            {startModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 380 }}>
                        <div className="modal-header"><h3 className="modal-title">Start Shift</h3></div>
                        {actionError && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14 }}>{actionError}</div>}
                        <form onSubmit={handleStartShift}>
                            <div className="form-group">
                                <label className="form-label">Opening Cash (₹)</label>
                                <input type="number" min="0" className="input" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="e.g. 5000" autoFocus />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setStartModalOpen(false)} disabled={actionLoading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? 'Starting…' : 'Start Shift'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* End Shift Modal */}
            {endModalOpen && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: 380 }}>
                        <div className="modal-header"><h3 className="modal-title">End Shift</h3></div>
                        {report && (
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                                Expected cash in drawer: <strong>{formatCurrency(report.expectedCash)}</strong>
                            </p>
                        )}
                        {actionError && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 14 }}>{actionError}</div>}
                        <form onSubmit={handleEndShift}>
                            <div className="form-group">
                                <label className="form-label required">Actual Cash Counted (₹)</label>
                                <input type="number" min="0" required className="input" value={closingCash} onChange={e => setClosingCash(e.target.value)} autoFocus />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEndModalOpen(false)} disabled={actionLoading}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? 'Closing…' : 'End Shift'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashierShiftSummary;