import React, { useState } from 'react';
import {
  X, CreditCard, Smartphone, Wallet, Banknote, SplitSquareHorizontal,
  CheckCircle2, XCircle, Loader2, ChevronRight, Plus, Trash2, AlertCircle,
  User, Phone, Mail, ArrowRight, UserCheck, UserX
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import api from '../../services/api';

// ─── Payment method config ────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'CASH',   label: 'Cash',   icon: Banknote,              color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  { id: 'CARD',   label: 'Card',   icon: CreditCard,            color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
  { id: 'UPI',    label: 'UPI',    icon: Smartphone,            color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)' },
  { id: 'WALLET', label: 'Wallet', icon: Wallet,                color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
  { id: 'SPLIT',  label: 'Split',  icon: SplitSquareHorizontal, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)' },
];

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n || 0);

const SIM_IDLE       = 'idle';
const SIM_PROCESSING = 'processing';
const SIM_SUCCESS    = 'success';
const SIM_FAILED     = 'failed';

// ─── Step constants ───────────────────────────────────────────────────────────
const STEP_CUSTOMER = 'customer';
const STEP_PAYMENT  = 'payment';

// ─── Inline styles (avoids any CSS class dependency issues) ───────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modal: {
    background: 'var(--bg-elevated, #1e2130)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    borderRadius: '16px',
    width: '100%', maxWidth: '560px',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '18px', fontWeight: 700,
    color: 'var(--text-primary, #f1f5f9)', margin: 0,
  },
  headerSub: {
    fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-tertiary, #64748b)', padding: '6px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  stepBar: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '14px 24px',
    borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    flexShrink: 0,
  },
  stepItem: (active, done) => ({
    display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
    opacity: (!active && !done) ? 0.4 : 1,
  }),
  stepCircle: (active, done) => ({
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: 700, flexShrink: 0,
    background: done ? '#10b981' : active ? 'var(--brand-500, #6366f1)' : 'var(--bg-base, #141624)',
    color: (done || active) ? '#fff' : 'var(--text-tertiary, #64748b)',
    border: active ? '2px solid var(--brand-400, #818cf8)' : '2px solid transparent',
  }),
  stepLabel: (active) => ({
    fontSize: '13px', fontWeight: active ? 600 : 400,
    color: active ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)',
  }),
  stepDivider: {
    flex: 0, width: '24px', height: '1px',
    background: 'var(--border-subtle, rgba(255,255,255,0.08))',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '24px',
  },
  footer: {
    display: 'flex', gap: '12px', padding: '16px 24px',
    borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
    flexShrink: 0,
  },
  // Customer step
  customerCard: (selected) => ({
    border: `2px solid ${selected ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '12px', padding: '16px',
    background: selected ? 'rgba(99,102,241,0.08)' : 'var(--bg-base, #141624)',
    cursor: 'pointer', transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px',
  }),
  formGroup: { marginBottom: '16px' },
  label: {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'var(--text-secondary, #94a3b8)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: 'var(--bg-base, #141624)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
    color: 'var(--text-primary, #f1f5f9)', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputLarge: {
    width: '100%', padding: '14px', borderRadius: '10px',
    background: 'var(--bg-base, #141624)',
    border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
    color: 'var(--text-primary, #f1f5f9)', fontSize: '24px', fontWeight: 700,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono, monospace)',
  },
  // Payment method buttons
  methodGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px',
    marginBottom: '20px',
  },
  methodBtn: (cfg, active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '6px', padding: '12px 8px', borderRadius: '12px',
    border: `2px solid ${active ? cfg.color : 'rgba(255,255,255,0.08)'}`,
    background: active ? cfg.bg : 'transparent',
    color: active ? cfg.color : 'var(--text-secondary, #94a3b8)',
    cursor: 'pointer', transition: 'all 0.15s',
    fontSize: '11px', fontWeight: 600,
  }),
  // Summary card
  summaryCard: (highlight) => ({
    background: highlight ? 'rgba(16,185,129,0.05)' : 'var(--bg-base, #141624)',
    border: `1px solid ${highlight ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '12px', padding: '16px',
  }),
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '8px',
  },
  summaryLabel: { fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' },
  summaryValue: { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' },
  changeAmount: (val) => ({
    fontSize: '32px', fontWeight: 800,
    color: val > 0 ? '#10b981' : 'var(--text-primary, #f1f5f9)',
    fontFamily: 'var(--font-mono, monospace)',
  }),
  divider: {
    height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0',
  },
  // Quick amounts
  quickRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' },
  quickBtn: {
    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    background: 'var(--bg-base, #141624)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-primary, #f1f5f9)', cursor: 'pointer',
  },
  // Buttons
  btnPrimary: {
    flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
    background: 'var(--brand-500, #6366f1)', color: '#fff',
    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    flex: 1, padding: '14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
    color: 'var(--text-primary, #f1f5f9)', fontSize: '15px', fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
  errorBox: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '12px', marginBottom: '16px',
    color: '#f87171', fontSize: '13px',
  },
  digitalCenter: {
    background: 'var(--bg-base, #141624)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '32px 24px', textAlign: 'center',
  },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px', borderRadius: '20px',
    fontSize: '12px', fontWeight: 600,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaymentModal({ order, onSuccess, onClose }) {
  const grandTotal = order?.grandTotal || 0;

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep]                       = useState(STEP_CUSTOMER);

  // ── Customer state ──────────────────────────────────────────────────────────
  const [customerMode, setCustomerMode]       = useState('walkin'); // 'walkin' | 'new'
  const [customerForm, setCustomerForm]       = useState({ name: '', phone: '', email: '' });
  const [customerSearchQ, setCustomerSearchQ] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSaving, setCustomerSaving]   = useState(false);
  const [customerError, setCustomerError]     = useState(null);

  // ── Payment state ───────────────────────────────────────────────────────────
  const [activeMethod, setActiveMethod]       = useState('CASH');
  const [cashReceived, setCashReceived]       = useState('');
  const [simState, setSimState]               = useState(SIM_IDLE);
  const [error, setError]                     = useState(null);
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [splitLegs, setSplitLegs]             = useState([
    { method: 'CASH', amount: '' },
    { method: 'UPI',  amount: '' },
  ]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isSplit   = activeMethod === 'SPLIT';
  const isCash    = activeMethod === 'CASH';
  const isDigital = ['CARD', 'UPI', 'WALLET'].includes(activeMethod);

  const cashAmount       = parseFloat(cashReceived) || 0;
  const change           = isCash ? Math.max(cashAmount - grandTotal, 0) : 0;
  const cashInsufficient = isCash && cashReceived !== '' && cashAmount < grandTotal;

  const splitTotal     = splitLegs.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const splitRemaining = grandTotal - splitTotal;
  const splitReady     = Math.abs(splitRemaining) < 0.01;

  // ── Customer step handlers ──────────────────────────────────────────────────
  const handleCustomerSearch = async (q) => {
    setCustomerSearchQ(q);
    if (q.length < 2) { setCustomerResults([]); return; }
    try {
      const res = await api.get('/api/customer', { params: { search: q } });
      setCustomerResults(Array.isArray(res.data) ? res.data.slice(0, 5) : res.data?.content?.slice(0, 5) || []);
    } catch { setCustomerResults([]); }
  };

  const handleSaveNewCustomer = async () => {
    if (!customerForm.name.trim()) { setCustomerError('Name is required.'); return; }
    if (!customerForm.phone.trim()) { setCustomerError('Phone is required.'); return; }
    setCustomerError(null);
    setCustomerSaving(true);
    try {
      const res = await api.post('/api/customer', {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim() || null,
      });
      const savedCustomer = res.data;
      setSelectedCustomer(savedCustomer);
      // Link the new customer to the already-created order
      if (order?.id) {
        try { await api.patch(`/api/orders/${order.id}/customer`, { customerId: savedCustomer.id }); } catch {}
      }
      setCustomerMode('walkin');
      setStep(STEP_PAYMENT);
    } catch (e) {
      setCustomerError(e.response?.data?.message || 'Could not save customer.');
    } finally {
      setCustomerSaving(false);
    }
  };

  const handleProceedToPayment = () => {
    // walkin = no customer, or one was selected/created
    setStep(STEP_PAYMENT);
  };

  // ── Payment handlers ─────────────────────────────────────────────────────────
  const handleMethodChange = (method) => {
    setActiveMethod(method); setSimState(SIM_IDLE); setError(null); setCashReceived('');
  };

  const simulateDigital = () => {
    setSimState(SIM_PROCESSING);
    setTimeout(() => {
      setSimState(Math.random() > 0.1 ? SIM_SUCCESS : SIM_FAILED);
    }, 2000);
  };

  const addSplitLeg    = () => setSplitLegs(p => [...p, { method: 'CASH', amount: '' }]);
  const removeSplitLeg = (i) => setSplitLegs(p => p.filter((_, idx) => idx !== i));
  const updateSplitLeg = (i, f, v) => setSplitLegs(p => p.map((l, idx) => idx === i ? { ...l, [f]: v } : l));

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      let payload;
      if (isSplit) {
        if (!splitReady) { setError(`Remaining: ${fmt(splitRemaining)}`); setIsSubmitting(false); return; }
        payload = { orderId: order.id, splitLegs: splitLegs.map(l => ({ amount: parseFloat(l.amount), paymentMethod: l.method, remarks: null })) };
      } else if (isCash) {
        if (cashInsufficient) { setError('Amount received is less than total.'); setIsSubmitting(false); return; }
        payload = { orderId: order.id, amount: grandTotal, paymentMethod: 'CASH', remarks: cashAmount > grandTotal ? `Change: ${fmt(change)}` : null };
      } else {
        if (simState !== SIM_SUCCESS) { setError('Please confirm the digital payment first.'); setIsSubmitting(false); return; }
        payload = { orderId: order.id, amount: grandTotal, paymentMethod: activeMethod, remarks: `Simulated ${activeMethod}` };
      }
      const res = await paymentService.processPayment(payload);
      onSuccess(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  const isCustomerStep = step === STEP_CUSTOMER;
  const isPaymentStep  = step === STEP_PAYMENT;

  return (
      <div style={S.overlay}>
        <div style={S.modal}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div>
              <p style={S.headerTitle}>
                {isCustomerStep ? 'Customer Details' : 'Payment'}
              </p>
              <p style={S.headerSub}>
                Order {order?.orderNumber}&nbsp;•&nbsp;
                <span style={{ fontWeight: 700, color: '#818cf8' }}>{fmt(grandTotal)}</span>
              </p>
            </div>
            <button style={S.closeBtn} onClick={onClose}><X size={18} /></button>
          </div>

          {/* ── Step indicator ── */}
          <div style={S.stepBar}>
            <div style={S.stepItem(isCustomerStep, isPaymentStep)}>
              <div style={S.stepCircle(isCustomerStep, isPaymentStep)}>
                {isPaymentStep ? <CheckCircle2 size={14} /> : '1'}
              </div>
              <span style={S.stepLabel(isCustomerStep)}>Customer</span>
            </div>
            <div style={S.stepDivider} />
            <div style={S.stepItem(isPaymentStep, false)}>
              <div style={S.stepCircle(isPaymentStep, false)}>2</div>
              <span style={S.stepLabel(isPaymentStep)}>Payment</span>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={S.body}>

            {/* ════════ STEP 1: CUSTOMER ════════ */}
            {isCustomerStep && (
                <div>
                  {customerError && (
                      <div style={S.errorBox}>
                        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                        {customerError}
                      </div>
                  )}

                  {/* Selected customer chip */}
                  {selectedCustomer && (
                      <div style={{ ...S.summaryCard(true), marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#818cf8' }}>
                            {selectedCustomer.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', fontSize: 14 }}>{selectedCustomer.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>{selectedCustomer.phone} {selectedCustomer.email ? `• ${selectedCustomer.email}` : ''}</div>
                          </div>
                        </div>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                                onClick={() => setSelectedCustomer(null)}><X size={16} /></button>
                      </div>
                  )}

                  {!selectedCustomer && (
                      <>
                        {/* Mode toggle */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                          {[
                            { id: 'walkin', label: 'Walk-in / Skip', icon: UserX },
                            { id: 'search', label: 'Existing Customer', icon: UserCheck },
                            { id: 'new',    label: 'New Customer', icon: User },
                          ].map(({ id, label, icon: Icon }) => (
                              <button key={id}
                                      onClick={() => { setCustomerMode(id); setCustomerError(null); }}
                                      style={{
                                        flex: 1, padding: '10px 8px', borderRadius: '10px',
                                        border: `2px solid ${customerMode === id ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                                        background: customerMode === id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        color: customerMode === id ? '#818cf8' : 'var(--text-secondary, #94a3b8)',
                                        cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                      }}>
                                <Icon size={16} />
                                {label}
                              </button>
                          ))}
                        </div>

                        {/* Walk-in info */}
                        {customerMode === 'walkin' && (
                            <div style={{ ...S.summaryCard(false), textAlign: 'center', padding: '24px' }}>
                              <UserX size={32} style={{ color: '#64748b', marginBottom: 8 }} />
                              <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 14 }}>
                                No customer will be linked to this order.<br />
                                Click <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>Proceed to Payment</strong> to continue.
                              </div>
                            </div>
                        )}

                        {/* Search existing */}
                        {customerMode === 'search' && (
                            <div>
                              <div style={S.formGroup}>
                                <label style={S.label}>Search by name or phone</label>
                                <input
                                    style={S.input} placeholder="e.g. Rahul or 9876..."
                                    value={customerSearchQ}
                                    onChange={e => handleCustomerSearch(e.target.value)}
                                    autoFocus
                                />
                              </div>
                              {customerResults.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {customerResults.map(c => (
                                        <div key={c.id} style={S.customerCard(false)}
                                             onClick={async () => {
                                               setSelectedCustomer(c);
                                               setCustomerResults([]); setCustomerSearchQ('');
                                               if (order?.id) {
                                                 try { await api.patch(`/api/orders/${order.id}/customer`, { customerId: c.id }); } catch {}
                                               }
                                             }}>
                                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#818cf8', fontSize: 14, flexShrink: 0 }}>
                                            {c.name?.charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', fontSize: 14 }}>{c.name}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.phone}{c.email ? ` • ${c.email}` : ''}</div>
                                          </div>
                                        </div>
                                    ))}
                                  </div>
                              )}
                              {customerSearchQ.length >= 2 && customerResults.length === 0 && (
                                  <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '16px 0' }}>
                                    No customers found. Try adding a new one.
                                  </div>
                              )}
                            </div>
                        )}

                        {/* New customer form */}
                        {customerMode === 'new' && (
                            <div>
                              <div style={S.formGroup}>
                                <label style={S.label}><User size={11} style={{ marginRight: 4 }} />Full Name *</label>
                                <input style={S.input} placeholder="e.g. Rahul Sharma" value={customerForm.name}
                                       onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                              </div>
                              <div style={S.formGroup}>
                                <label style={S.label}><Phone size={11} style={{ marginRight: 4 }} />Phone Number *</label>
                                <input style={S.input} placeholder="e.g. 9876543210" value={customerForm.phone} type="tel"
                                       onChange={e => setCustomerForm(f => ({ ...f, phone: e.target.value }))} />
                              </div>
                              <div style={S.formGroup}>
                                <label style={S.label}><Mail size={11} style={{ marginRight: 4 }} />Email (optional)</label>
                                <input style={S.input} placeholder="e.g. rahul@email.com" value={customerForm.email} type="email"
                                       onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))} />
                              </div>
                            </div>
                        )}
                      </>
                  )}
                </div>
            )}

            {/* ════════ STEP 2: PAYMENT ════════ */}
            {isPaymentStep && (
                <div>
                  {/* Customer summary pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Customer:</span>
                    <span style={{ ...S.tag, background: selectedCustomer ? 'rgba(99,102,241,0.15)' : 'rgba(100,116,139,0.15)', color: selectedCustomer ? '#818cf8' : '#94a3b8' }}>
                  {selectedCustomer ? <><UserCheck size={11} />{selectedCustomer.name}</> : <><UserX size={11} />Walk-in</>}
                </span>
                    <button style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 12, color: '#64748b', cursor: 'pointer' }}
                            onClick={() => setStep(STEP_CUSTOMER)}>Change</button>
                  </div>

                  {error && (
                      <div style={S.errorBox}>
                        <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                        {error}
                      </div>
                  )}

                  {/* Method selector */}
                  <div style={S.methodGrid}>
                    {PAYMENT_METHODS.map(m => {
                      const Icon = m.icon;
                      const active = activeMethod === m.id;
                      return (
                          <button key={m.id} style={S.methodBtn(m, active)} onClick={() => handleMethodChange(m.id)}>
                            <Icon size={20} />
                            <span>{m.label}</span>
                          </button>
                      );
                    })}
                  </div>

                  {/* ── CASH ── */}
                  {isCash && (
                      <div>
                        <div style={S.formGroup}>
                          <label style={S.label}>Amount Received (₹)</label>
                          <input
                              type="number" min="0" step="0.50"
                              style={{ ...S.inputLarge, borderColor: cashInsufficient ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                              placeholder="0.00" value={cashReceived} autoFocus
                              onChange={e => setCashReceived(e.target.value)}
                          />
                          {cashInsufficient && (
                              <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                                Short by {fmt(grandTotal - cashAmount)}
                              </p>
                          )}
                        </div>

                        <div style={S.summaryCard(change > 0)}>
                          <div style={S.summaryRow}>
                            <span style={S.summaryLabel}>Grand Total</span>
                            <span style={{ ...S.summaryValue, fontFamily: 'var(--font-mono, monospace)' }}>{fmt(grandTotal)}</span>
                          </div>
                          <div style={S.summaryRow}>
                            <span style={S.summaryLabel}>Received</span>
                            <span style={{ ...S.summaryValue, fontFamily: 'var(--font-mono, monospace)', color: cashInsufficient ? '#f87171' : 'var(--text-primary, #f1f5f9)' }}>{fmt(cashAmount)}</span>
                          </div>
                          <div style={S.divider} />
                          <div style={S.summaryRow}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: change > 0 ? '#10b981' : '#94a3b8' }}>Change to Return</span>
                            <span style={S.changeAmount(change)}>{fmt(change)}</span>
                          </div>
                        </div>

                        <div style={S.quickRow}>
                          {[grandTotal, Math.ceil(grandTotal / 100) * 100, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000]
                              .filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
                              .map(val => (
                                  <button key={val} style={S.quickBtn} onClick={() => setCashReceived(val.toFixed(2))}>
                                    {fmt(val)}
                                  </button>
                              ))}
                        </div>
                      </div>
                  )}

                  {/* ── DIGITAL ── */}
                  {isDigital && (
                      <div style={S.digitalCenter}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: '#818cf8', marginBottom: 8, fontFamily: 'var(--font-mono, monospace)' }}>{fmt(grandTotal)}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                          {activeMethod === 'CARD'   && 'Swipe or tap the customer\'s card on the terminal.'}
                          {activeMethod === 'UPI'    && 'Show QR code or enter the customer\'s UPI ID.'}
                          {activeMethod === 'WALLET' && 'Customer confirms from their wallet app.'}
                        </div>

                        {simState === SIM_IDLE && (
                            <button style={{ ...S.btnPrimary, flex: 'none', padding: '10px 24px', borderRadius: '10px' }} onClick={simulateDigital}>
                              <ChevronRight size={16} /> Initiate {activeMethod} Payment
                            </button>
                        )}
                        {simState === SIM_PROCESSING && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                              <Loader2 size={40} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>Processing…</span>
                            </div>
                        )}
                        {simState === SIM_SUCCESS && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                              <CheckCircle2 size={48} style={{ color: '#10b981' }} />
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>Payment Confirmed</span>
                              <span style={{ fontSize: 12, color: '#64748b' }}>TXN: SIM_{Date.now()}</span>
                            </div>
                        )}
                        {simState === SIM_FAILED && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                              <XCircle size={40} style={{ color: '#f87171' }} />
                              <span style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>Payment Failed</span>
                              <button style={{ ...S.btnSecondary, flex: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: 13 }} onClick={simulateDigital}>
                                Retry
                              </button>
                            </div>
                        )}
                      </div>
                  )}

                  {/* ── SPLIT ── */}
                  {isSplit && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', fontSize: 14 }}>Split Legs</span>
                          <button style={{ ...S.quickBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={addSplitLeg}>
                            <Plus size={13} /> Add Leg
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 12 }}>
                          {splitLegs.map((leg, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'var(--bg-base, #141624)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={S.label}>Method</label>
                                  <select style={S.input} value={leg.method} onChange={e => updateSplitLeg(idx, 'method', e.target.value)}>
                                    {PAYMENT_METHODS.filter(m => m.id !== 'SPLIT').map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                  </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={S.label}>Amount (₹)</label>
                                  <input type="number" min="0" style={S.input} placeholder="0.00" value={leg.amount}
                                         onChange={e => updateSplitLeg(idx, 'amount', e.target.value)} />
                                </div>
                                {splitLegs.length > 2 && (
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '8px', marginBottom: 2 }} onClick={() => removeSplitLeg(idx)}>
                                      <Trash2 size={15} />
                                    </button>
                                )}
                              </div>
                          ))}
                        </div>

                        <div style={S.summaryCard(splitReady)}>
                          <div style={S.summaryRow}>
                            <span style={S.summaryLabel}>Grand Total</span>
                            <span style={S.summaryValue}>{fmt(grandTotal)}</span>
                          </div>
                          <div style={S.summaryRow}>
                            <span style={S.summaryLabel}>Split Total</span>
                            <span style={S.summaryValue}>{fmt(splitTotal)}</span>
                          </div>
                          <div style={S.divider} />
                          <div style={S.summaryRow}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: splitReady ? '#10b981' : '#f87171' }}>
                        {splitReady ? 'Balanced ✓' : 'Remaining'}
                      </span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: splitReady ? '#10b981' : '#f87171', fontFamily: 'var(--font-mono, monospace)' }}>
                        {splitReady ? '—' : fmt(Math.abs(splitRemaining))}
                      </span>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={S.footer}>
            {isCustomerStep && (
                <>
                  <button style={S.btnSecondary} onClick={onClose}>Cancel</button>

                  {customerMode === 'new' && !selectedCustomer ? (
                      <button style={{ ...S.btnPrimary, opacity: customerSaving ? 0.7 : 1 }}
                              onClick={handleSaveNewCustomer} disabled={customerSaving}>
                        {customerSaving
                            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                            : <><UserCheck size={16} /> Save & Proceed</>}
                      </button>
                  ) : (
                      <button style={S.btnPrimary} onClick={handleProceedToPayment}>
                        <ArrowRight size={16} />
                        {selectedCustomer ? 'Proceed to Payment' : 'Skip & Pay'}
                      </button>
                  )}
                </>
            )}

            {isPaymentStep && (
                <>
                  <button style={S.btnSecondary} onClick={() => setStep(STEP_CUSTOMER)} disabled={isSubmitting}>
                    Back
                  </button>
                  <button
                      style={{ ...S.btnPrimary, opacity: (isSubmitting || (isCash && cashInsufficient) || (isDigital && simState !== SIM_SUCCESS) || (isSplit && !splitReady)) ? 0.5 : 1 }}
                      onClick={handleSubmit}
                      disabled={isSubmitting || (isCash && cashInsufficient) || (isDigital && simState !== SIM_SUCCESS) || (isSplit && !splitReady)}>
                    {isSubmitting
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                        : <><CheckCircle2 size={16} /> Confirm Payment</>}
                  </button>
                </>
            )}
          </div>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
  );
}