import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../../store/slices/authSlice';
import { Menu, Clock, History, ChevronLeft, ChevronRight, Search, Receipt } from 'lucide-react';
import api from '../../services/api';
import orderService from '../../services/orderService';
import CashierNavDrawer from './CashierNavDrawer';
import './CashierTerminal.css';
import './CashierShell.css';

const PAGE_SIZE = 12;

const statusBadgeClass = (status) => {
    if (status === 'COMPLETED') return 'stock-ok';
    if (status === 'CANCELLED' || status === 'REFUNDED') return 'stock-out';
    return 'stock-low';
};

const CashierOrderHistory = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);

    const [navOpen, setNavOpen] = useState(false);
    const [currentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [onlyMine, setOnlyMine] = useState(true);
    const [search, setSearch] = useState('');

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

    const loadOrders = useCallback(async (pageNum) => {
        setLoading(true);
        setError('');
        try {
            let branchId = localStorage.getItem('pos_branch_id');
            if (!branchId) {
                const invRes = await api.get('/api/inventory/me');
                branchId = invRes.data?.[0]?.branchId;
                if (branchId) localStorage.setItem('pos_branch_id', String(branchId));
            }
            if (!branchId) throw new Error('Could not determine your branch');

            const res = await orderService.getOrdersByBranch(branchId, {
                page: pageNum,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                dir: 'desc',
            });

            setOrders(res.data.content || []);
            setTotalPages(res.data.totalPages ?? 0);
        } catch (err) {
            console.error('Failed to load order history', err);
            setError('Could not load order history. Please try again.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const visibleOrders = orders
        .filter(o => !onlyMine || o.cashierId === user?.id)
        .filter(o => {
            if (!search.trim()) return true;
            const q = search.trim().toLowerCase();
            return (
                o.orderNumber?.toLowerCase().includes(q) ||
                o.customerName?.toLowerCase().includes(q)
            );
        });

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
                        <span className="pos-brand-title">Order History</span>
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
                        <div className="cashier-page-title">Order History</div>
                        <div className="cashier-page-subtitle">Orders placed at your branch</div>
                    </div>

                    <div className="cashier-page-toolbar">
                        <div className="pos-field">
                            <Search className="pos-field-icon" />
                            <input
                                placeholder="Search order # or customer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className={`pos-action-btn ${onlyMine ? '' : 'warn'}`}
                            onClick={() => setOnlyMine(v => !v)}
                            style={{ width: 'auto', padding: '0 16px' }}
                        >
                            {onlyMine ? 'Showing: My Orders' : 'Showing: All Branch Orders'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="cashier-loading">Loading orders...</div>
                ) : error ? (
                    <div className="cashier-empty">
                        <Receipt className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto' }} />
                        <h3>{error}</h3>
                    </div>
                ) : visibleOrders.length === 0 ? (
                    <div className="cashier-empty">
                        <History className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto' }} />
                        <h3>No orders found</h3>
                        <p>Try a different search, or check "All Branch Orders".</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Cashier</th>
                                    <th>Items</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {visibleOrders.map(o => (
                                    <tr
                                        key={o.id}
                                        onClick={() => navigate(`/cashier/invoice/${o.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="pos-figure">{o.orderNumber}</td>
                                        <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                                        <td>{o.customerName || 'Walk-in'}</td>
                                        <td>{o.cashierName || '—'}</td>
                                        <td>{o.totalItems ?? o.items?.length ?? 0}</td>
                                        <td>{o.paymentMethod || '—'}</td>
                                        <td>
                        <span className={`pos-card-badge ${statusBadgeClass(o.orderStatus)}`} style={{ position: 'static', display: 'inline-flex' }}>
                          {o.orderStatus}
                        </span>
                                        </td>
                                        <td className="pos-figure" style={{ textAlign: 'right', fontWeight: 700 }}>
                                            {formatCurrency(o.grandTotal)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="cashier-pagination">
                            <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
                            <div className="cashier-pagination-btns">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierOrderHistory;