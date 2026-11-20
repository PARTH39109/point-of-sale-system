import React, { useState, useEffect } from 'react';
import { Menu, Clock, Search, UserPlus, Users, Phone, Mail, Gift } from 'lucide-react';
import api from '../../services/api';
import CashierNavDrawer from './CashierNavDrawer';
import './CashierTerminal.css';
import './CashierShell.css';

const CashierCustomers = () => {
    const [navOpen, setNavOpen] = useState(false);
    const [currentTime] = useState(new Date());

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [showAdd, setShowAdd] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/customer');
            setCustomers(res.data || []);
        } catch (err) {
            console.error('Failed to load customers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCustomers(); }, []);

    const filtered = customers.filter(c => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
            c.name?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.email?.toLowerCase().includes(q)
        );
    });

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        if (!newCustomer.name.trim()) return;
        setSaving(true);
        setSaveError('');
        try {
            await api.post('/api/customer', newCustomer);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
            setShowAdd(false);
            loadCustomers();
        } catch (err) {
            console.error('Failed to add customer', err);
            setSaveError(err.response?.data?.message || 'Could not save customer.');
        } finally {
            setSaving(false);
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
                        <span className="pos-brand-title">Customers</span>
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
                        <div className="cashier-page-title">Customers</div>
                        <div className="cashier-page-subtitle">{customers.length} customers on file</div>
                    </div>

                    <div className="cashier-page-toolbar">
                        <div className="pos-field">
                            <Search className="pos-field-icon" />
                            <input
                                placeholder="Search name, phone, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAdd(v => !v)}>
                            <UserPlus className="w-4 h-4 mr-2" /> Add Customer
                        </button>
                    </div>
                </div>

                {showAdd && (
                    <form onSubmit={handleAddCustomer} className="cashier-stat-card" style={{ maxWidth: 620, marginBottom: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div className="form-group">
                                <label className="form-label required">Name</label>
                                <input
                                    className="input"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    className="input"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input
                                    className="input"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                />
                            </div>
                        </div>
                        {saveError && <div className="form-error" style={{ marginBottom: 10 }}>{saveError}</div>}
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Customer'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="cashier-loading">Loading customers...</div>
                ) : filtered.length === 0 ? (
                    <div className="cashier-empty">
                        <Users className="w-10 h-10" style={{ opacity: 0.3, margin: '0 auto' }} />
                        <h3>No customers found</h3>
                        <p>Try a different search or add a new customer.</p>
                    </div>
                ) : (
                    <div className="pos-product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                        {filtered.map(c => (
                            <div key={c.id} className="cashier-stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                    <div className="cashier-drawer-avatar">{(c.name || '?').charAt(0).toUpperCase()}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{c.name}</div>
                                        {c.loyaltyPoints > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--warning-text)' }}>
                                                <Gift className="w-3 h-3" /> {c.loyaltyPoints} points
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {c.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        <Phone className="w-3.5 h-3.5" /> {c.phone}
                                    </div>
                                )}
                                {c.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                                        <Mail className="w-3.5 h-3.5" /> {c.email}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierCustomers;