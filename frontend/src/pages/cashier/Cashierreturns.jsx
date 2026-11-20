import React, { useState } from 'react';
import { Menu, Clock, Search, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import orderService from '../../services/orderService';
import refundService from '../../services/refundService';
import CashierNavDrawer from './CashierNavDrawer';
import './CashierTerminal.css';
import './CashierShell.css';

const CashierReturns = () => {
    const [navOpen, setNavOpen] = useState(false);
    const [currentTime] = useState(new Date());

    const [orderNumber, setOrderNumber] = useState('');
    const [order, setOrder] = useState(null);
    const [pastRefunds, setPastRefunds] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const [selectedQty, setSelectedQty] = useState({}); // productId -> qty to refund
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [submitError, setSubmitError] = useState('');

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!orderNumber.trim()) return;
        setSearching(true);
        setSearchError('');
        setOrder(null);
        setSelectedQty({});
        setSuccessMsg('');
        setSubmitError('');
        try {
            const res = await orderService.getOrderByOrderNumber(orderNumber.trim());
            setOrder(res.data);
            try {
                const refundsRes = await refundService.getRefundsByOrder(res.data.id);
                setPastRefunds(refundsRes.data || []);
            } catch {
                setPastRefunds([]);
            }
        } catch (err) {
            console.error('Order lookup failed', err);
            setSearchError('No order found with that number.');
        } finally {
            setSearching(false);
        }
    };

    const alreadyRefundedQty = (productId) =>
        pastRefunds
            .flatMap(r => r.items || [])
            .filter(i => i.productId === productId)
            .reduce((sum, i) => sum + (i.quantityRefunded || 0), 0);

    const maxRefundable = (item) => Math.max(0, item.quantity - alreadyRefundedQty(item.productId));

    const setQty = (item, qty) => {
        const clamped = Math.max(0, Math.min(qty, maxRefundable(item)));
        setSelectedQty(prev => ({ ...prev, [item.productId]: clamped }));
    };

    const selectedItems = (order?.items || []).filter(i => (selectedQty[i.productId] || 0) > 0);
    const refundTotal = selectedItems.reduce((sum, i) => {
        const qty = selectedQty[i.productId] || 0;
        return sum + qty * i.unitPrice;
    }, 0);

    const handleSubmitRefund = async () => {
        if (selectedItems.length === 0) return;
        setSubmitting(true);
        setSubmitError('');
        setSuccessMsg('');
        try {
            const payload = {
                orderId: order.id,
                refundReason: reason || 'Customer return',
                refundType: selectedItems.length === (order.items || []).length ? 'FULL' : 'ITEM_WISE',
                notes: reason,
                items: selectedItems.map(i => ({
                    productId: i.productId,
                    quantityRefunded: selectedQty[i.productId],
                    unitPrice: i.unitPrice,
                    taxRefunded: 0,
                    discountRefunded: 0,
                    refundAmount: (selectedQty[i.productId] || 0) * i.unitPrice,
                })),
            };
            const res = await refundService.processRefund(payload);
            setSuccessMsg(`Refund ${res.data.refundNumber} processed for ${formatCurrency(res.data.refundAmount)}.`);
            setSelectedQty({});
            setReason('');
            const refundsRes = await refundService.getRefundsByOrder(order.id);
            setPastRefunds(refundsRes.data || []);
        } catch (err) {
            console.error('Refund failed', err);
            setSubmitError(err.response?.data?.message || 'Failed to process refund. Please try again.');
        } finally {
            setSubmitting(false);
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
                        <span className="pos-brand-title">Returns / Refunds</span>
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
                        <div className="cashier-page-title">Returns / Refunds</div>
                        <div className="cashier-page-subtitle">Look up an order to process a return</div>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="cashier-page-toolbar" style={{ marginBottom: 20 }}>
                    <div className="pos-field" style={{ width: 320 }}>
                        <Search className="pos-field-icon" />
                        <input
                            placeholder="Enter order number (e.g. ORD0042)..."
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={searching}>
                        {searching ? 'Searching...' : 'Find Order'}
                    </button>
                </form>

                {searchError && (
                    <div className="cashier-empty">
                        <AlertCircle className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto', color: 'var(--danger-text)' }} />
                        <h3>{searchError}</h3>
                    </div>
                )}

                {order && (
                    <>
                        <div className="cashier-stat-row">
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Order</div>
                                <div className="cashier-stat-value pos-figure">{order.orderNumber}</div>
                            </div>
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Customer</div>
                                <div className="cashier-stat-value" style={{ fontSize: 16 }}>{order.customerName || 'Walk-in'}</div>
                            </div>
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Order Total</div>
                                <div className="cashier-stat-value brand pos-figure">{formatCurrency(order.grandTotal)}</div>
                            </div>
                            <div className="cashier-stat-card">
                                <div className="cashier-stat-label">Status</div>
                                <div className="cashier-stat-value" style={{ fontSize: 16 }}>{order.orderStatus}</div>
                            </div>
                        </div>

                        <div className="table-container" style={{ marginBottom: 20 }}>
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Unit Price</th>
                                        <th>Purchased Qty</th>
                                        <th>Already Refunded</th>
                                        <th>Refund Qty</th>
                                        <th style={{ textAlign: 'right' }}>Refund Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {(order.items || []).map(item => {
                                        const refunded = alreadyRefundedQty(item.productId);
                                        const maxQty = maxRefundable(item);
                                        const qty = selectedQty[item.productId] || 0;
                                        return (
                                            <tr key={item.productId}>
                                                <td>{item.productName}</td>
                                                <td className="pos-figure">{formatCurrency(item.unitPrice)}</td>
                                                <td className="pos-figure">{item.quantity}</td>
                                                <td className="pos-figure">{refunded}</td>
                                                <td>
                                                    <div className="pos-qty-stepper" style={{ height: 32 }}>
                                                        <button className="pos-qty-btn" type="button" onClick={() => setQty(item, qty - 1)} disabled={maxQty === 0}>−</button>
                                                        <div className="pos-qty-value" style={{ width: 36 }}>{qty}</div>
                                                        <button className="pos-qty-btn" type="button" onClick={() => setQty(item, qty + 1)} disabled={qty >= maxQty}>+</button>
                                                    </div>
                                                </td>
                                                <td className="pos-figure" style={{ textAlign: 'right', fontWeight: 700 }}>
                                                    {formatCurrency(qty * item.unitPrice)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="cashier-stat-card" style={{ maxWidth: 520 }}>
                            <div className="form-group" style={{ marginBottom: 14 }}>
                                <label className="form-label">Reason for return</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Damaged item, wrong size..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <div className="pos-summary-total-row">
                                <span className="pos-summary-total-label">Refund Total</span>
                                <span className="pos-summary-total-value pos-figure" style={{ fontSize: 22 }}>{formatCurrency(refundTotal)}</span>
                            </div>

                            {submitError && (
                                <div style={{ color: 'var(--danger-text)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <AlertCircle className="w-4 h-4" /> {submitError}
                                </div>
                            )}
                            {successMsg && (
                                <div style={{ color: 'var(--success-text)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle2 className="w-4 h-4" /> {successMsg}
                                </div>
                            )}

                            <button
                                className="btn btn-primary w-full"
                                disabled={selectedItems.length === 0 || submitting}
                                onClick={handleSubmitRefund}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {submitting ? 'Processing...' : 'Process Refund'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CashierReturns;