import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import branchSettingsService from '../../services/branchSettingsService';
import {
  Settings, Building2, Clock, Receipt, ShoppingCart, TimerReset, Users,
  Bell, Lock, Database, User, Info, Save, RotateCcw, CheckCircle2,
  AlertCircle, Loader2, RefreshCw, Eye, EyeOff, ChevronRight,
  Shield, Wifi, WifiOff, Server, Package, X
} from 'lucide-react';

// ─── Section IDs ────────────────────────────────────────────────
const SECTIONS = [
  { id: 'branch-info',   label: 'Branch Information', icon: Building2 },
  { id: 'hours',         label: 'Business Hours',     icon: Clock },
  { id: 'receipt',       label: 'Receipt Settings',   icon: Receipt },
  { id: 'orders',        label: 'Order Settings',     icon: ShoppingCart },
  { id: 'shifts',        label: 'Shift Settings',     icon: TimerReset },
  { id: 'permissions',   label: 'Employee Permissions', icon: Users },
  { id: 'notifications', label: 'Notifications',      icon: Bell },
  { id: 'security',      label: 'Security',           icon: Lock },
  { id: 'sync',          label: 'Backup & Sync',      icon: Database },
  { id: 'profile',       label: 'My Profile',         icon: User },
  { id: 'about',         label: 'About',              icon: Info },
];

// ─── Utility Components ─────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: 10
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 12, minWidth: 300,
        padding: '14px 18px', borderRadius: 12,
        background: t.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
        backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.3s ease'
      }}>
        {t.type === 'success'
          ? <CheckCircle2 size={18} color="#10b981" />
          : <AlertCircle size={18} color="#ef4444" />}
        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)' }}>{t.message}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)' }}>
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: checked ? '#8b5cf6' : 'var(--bg-elevated)',
      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
      outline: 'none', boxShadow: checked ? '0 0 0 2px rgba(139,92,246,0.2)' : 'none'
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
      borderRadius: '50%', background: 'white', transition: 'left 0.2s ease',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
    }} />
  </button>
);

const ToggleRow = ({ label, description, value, onChange, disabled }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid var(--border-subtle)'
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
      {description && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{description}</div>}
    </div>
    <ToggleSwitch checked={!!value} onChange={onChange} disabled={disabled} />
  </div>
);

const SectionCard = ({ id, icon: Icon, title, description, children }) => (
  <div id={id} className="card" style={{ marginBottom: 24, scrollMarginTop: 80 }}>
    <div className="card-header" style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(139,92,246,0.1)', flexShrink: 0
        }}>
          <Icon size={20} color="#8b5cf6" />
        </div>
        <div>
          <div className="card-title" style={{ marginBottom: 2 }}>{title}</div>
          {description && <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{description}</div>}
        </div>
      </div>
    </div>
    {children}
  </div>
);

const FormInput = ({ label, value, onChange, type = 'text', disabled, required, hint, rows }) => (
  <div className="form-group">
    <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
    {rows ? (
      <textarea
        className="input" rows={rows} value={value || ''} onChange={e => onChange(e.target.value)}
        disabled={disabled} style={{ resize: 'vertical' }}
      />
    ) : (
      <input
        type={type} className="input" value={value || ''} onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
    )}
    {hint && <div className="form-hint">{hint}</div>}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────
export default function BranchManagerSettings() {
  const user = useSelector(selectUser);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeSection, setActiveSection] = useState('branch-info');
  const [toasts, setToasts] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', email: '', password: '', profilePicture: '' });

  // Toast helpers
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // Load settings
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await branchSettingsService.getSettings();
        setSettings(res.data);
        setProfileForm({
          fullName: user?.fullName || '',
          phone: user?.phone || '',
          email: user?.email || '',
          password: '',
          profilePicture: user?.profilePicture || ''
        });
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Update a nested setting field
  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  // Save handler
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await branchSettingsService.updateSettings(settings);
      setSettings(res.data);
      addToast('Settings saved successfully!');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Sync handler
  const handleSync = async () => {
    try {
      setSyncing(true);
      await branchSettingsService.syncNow();
      const res = await branchSettingsService.getSettings();
      setSettings(res.data);
      addToast('Branch data synced successfully!');
    } catch (err) {
      addToast('Sync failed. Please try again.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Profile save
  const handleProfileSave = async () => {
    try {
      setSaving(true);
      await branchSettingsService.updateProfile(profileForm);
      addToast('Profile updated successfully!');
      setProfileForm(p => ({ ...p, password: '' }));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="spin" color="var(--brand-400)" />
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── Left Nav ── */}
      <div style={{
        width: 220, flexShrink: 0, position: 'sticky', top: 80,
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '8px 0', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto'
      }}>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px',
                background: active ? 'rgba(139,92,246,0.1)' : 'none', border: 'none', cursor: 'pointer',
                borderLeft: active ? '3px solid #8b5cf6' : '3px solid transparent',
                color: active ? '#8b5cf6' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: active ? 600 : 400, textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Page Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Branch Settings</h1>
            <p style={{ color: 'var(--text-tertiary)', marginTop: 6, marginBottom: 0 }}>
              Configure settings for <strong style={{ color: 'var(--brand-400)' }}>{settings.branchName}</strong>
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        {/* ══ 1. Branch Information ══ */}
        <SectionCard id="branch-info" icon={Building2} title="Branch Information" description="Read-only branch details managed by the Store Admin.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Branch Name',    value: settings.branchName },
              { label: 'Branch Code',    value: settings.branchCode },
              { label: 'Store Name',     value: settings.storeName },
              { label: 'Contact Number', value: settings.contactNumber || 'Not set' },
              { label: 'Manager Name',   value: settings.managerName || 'Not assigned' },
              { label: 'Status',         value: settings.branchIsActive ? '🟢 Active' : '🔴 Inactive' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
            <div style={{ gridColumn: 'span 2', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Branch Address</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{settings.branchAddress || 'Not set'}</div>
            </div>
          </div>
        </SectionCard>

        {/* ══ 2. Business Hours ══ */}
        <SectionCard id="hours" icon={Clock} title="Business Hours" description="Set your branch operating schedule.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormInput label="Opening Time" value={settings.openingTime} onChange={v => set('openingTime', v)} hint="e.g. 09:00 AM" />
            <FormInput label="Closing Time" value={settings.closingTime} onChange={v => set('closingTime', v)} hint="e.g. 10:00 PM" />
            <FormInput label="Weekly Off" value={settings.weeklyOff} onChange={v => set('weeklyOff', v)} hint="e.g. Sunday or None" />
            <FormInput label="Holiday Schedule" value={settings.holidaySchedule} onChange={v => set('holidaySchedule', v)} hint="e.g. National Holidays" />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Hours
            </button>
            <button className="btn btn-secondary" onClick={() => set('openingTime', '09:00 AM') || set('closingTime', '10:00 PM') || set('weeklyOff', 'None')}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </SectionCard>

        {/* ══ 3. Receipt Settings ══ */}
        <SectionCard id="receipt" icon={Receipt} title="Receipt Settings" description="Customize what appears on receipts printed from this branch. These settings are branch-specific and isolated from all other branches.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormInput label="Receipt Branch Name" value={settings.receiptBranchName} onChange={v => set('receiptBranchName', v)} />
            <FormInput label="Branch Phone Number" value={settings.receiptPhone} onChange={v => set('receiptPhone', v)} />
            <div style={{ gridColumn: 'span 2' }}>
              <FormInput label="Receipt Address" value={settings.receiptAddress} onChange={v => set('receiptAddress', v)} rows={2} />
            </div>
            <FormInput label="GST Number" value={settings.receiptGstNumber} onChange={v => set('receiptGstNumber', v)} hint="Optional — leave blank to hide" />
            <FormInput label="Receipt Header" value={settings.receiptHeader} onChange={v => set('receiptHeader', v)} hint="e.g. Welcome to ABC Store!" />
            <div style={{ gridColumn: 'span 2' }}>
              <FormInput label="Receipt Footer" value={settings.receiptFooter} onChange={v => set('receiptFooter', v)} hint="Appears at the very bottom of every receipt" />
            </div>
            <FormInput label="Thank You Message" value={settings.receiptThankYouMessage} onChange={v => set('receiptThankYouMessage', v)} hint="e.g. Thank You! Visit Again." />
            <div style={{ gridColumn: 'span 2' }}>
              <FormInput label="Return / Exchange Policy" value={settings.receiptReturnPolicy} onChange={v => set('receiptReturnPolicy', v)} rows={3} hint="Displayed at the bottom of every receipt" />
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Visibility Options</div>
            <ToggleRow label="Show GST Number" description="Display GST number on all receipts" value={settings.showGstNumber} onChange={v => set('showGstNumber', v)} />
            <ToggleRow label="Show Branch Address" description="Print the branch address on receipts" value={settings.showBranchAddress} onChange={v => set('showBranchAddress', v)} />
            <ToggleRow label="Show Phone Number" description="Print the branch phone number on receipts" value={settings.showPhoneNumber} onChange={v => set('showPhoneNumber', v)} />
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save Receipt Settings
            </button>
          </div>
        </SectionCard>

        {/* ══ 4. Order Settings ══ */}
        <SectionCard id="orders" icon={ShoppingCart} title="Order Settings" description="Control what cashiers can do during the order process.">
          <ToggleRow label="Allow Discounts" description="Cashiers can apply discounts on orders" value={settings.allowDiscounts} onChange={v => set('allowDiscounts', v)} />
          <ToggleRow label="Allow Manual Price Override" description="Cashiers can change the price of an item before adding to cart" value={settings.allowManualPriceOverride} onChange={v => set('allowManualPriceOverride', v)} />
          <ToggleRow label="Allow Hold Orders" description="Cashiers can put orders on hold" value={settings.allowHoldOrders} onChange={v => set('allowHoldOrders', v)} />
          <ToggleRow label="Allow Resume Orders" description="Cashiers can resume previously held orders" value={settings.allowResumeOrders} onChange={v => set('allowResumeOrders', v)} />
          <ToggleRow label="Require Customer Before Checkout" description="A customer must be selected before an order can be placed" value={settings.requireCustomerBeforeCheckout} onChange={v => set('requireCustomerBeforeCheckout', v)} />
          <ToggleRow label="Allow Order Cancellation" description="Cashiers can cancel active orders" value={settings.allowOrderCancellation} onChange={v => set('allowOrderCancellation', v)} />
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </SectionCard>

        {/* ══ 5. Shift Settings ══ */}
        <SectionCard id="shifts" icon={TimerReset} title="Shift Settings" description="Configure cashier shift management policies for this branch.">
          <ToggleRow label="Require Opening Cash" description="Cashiers must enter opening cash when starting a shift" value={settings.requireOpeningCash} onChange={v => set('requireOpeningCash', v)} />
          <ToggleRow label="Require Closing Cash Count" description="Cashiers must count and enter cash when ending a shift" value={settings.requireClosingCashCount} onChange={v => set('requireClosingCashCount', v)} />
          <ToggleRow label="Auto Logout After Shift Ends" description="Automatically log out cashiers when they close their shift" value={settings.autoLogoutAfterShiftEnds} onChange={v => set('autoLogoutAfterShiftEnds', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <FormInput label="Default Opening Cash Amount (₹)" type="number" value={settings.defaultOpeningCashAmount} onChange={v => set('defaultOpeningCashAmount', v)} hint="Pre-filled value in Start Shift modal" />
            <FormInput label="Maximum Shift Duration (hours)" type="number" value={settings.maxShiftDuration} onChange={v => set('maxShiftDuration', v)} hint="Alert if a shift exceeds this duration" />
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </SectionCard>

        {/* ══ 6. Employee Permissions ══ */}
        <SectionCard id="permissions" icon={Users} title="Employee Permissions" description="Default permissions for cashiers at this branch. These are enforced for new cashiers.">
          <ToggleRow label="Can Process Refunds" value={settings.permRefund} onChange={v => set('permRefund', v)} />
          <ToggleRow label="Can Apply Discounts" value={settings.permDiscount} onChange={v => set('permDiscount', v)} />
          <ToggleRow label="Can Hold Orders" value={settings.permHoldOrders} onChange={v => set('permHoldOrders', v)} />
          <ToggleRow label="Can Resume Held Orders" value={settings.permResumeOrders} onChange={v => set('permResumeOrders', v)} />
          <ToggleRow label="Can Create New Customers" value={settings.permCustomerCreation} onChange={v => set('permCustomerCreation', v)} />
          <ToggleRow label="Can Override Prices" value={settings.permPriceOverride} onChange={v => set('permPriceOverride', v)} />
          <ToggleRow label="Can View Reports" value={settings.permViewReports} onChange={v => set('permViewReports', v)} />
          <ToggleRow label="Can End Their Own Shift" value={settings.permEndShift} onChange={v => set('permEndShift', v)} />
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </SectionCard>

        {/* ══ 7. Notifications ══ */}
        <SectionCard id="notifications" icon={Bell} title="Notification Settings" description="Choose which events trigger alerts for you as Branch Manager.">
          <ToggleRow label="Low Stock Alerts" description="Notify when any product falls below minimum stock level" value={settings.notifyLowStock} onChange={v => set('notifyLowStock', v)} />
          <ToggleRow label="New Cashier Requests" description="Notify when a new cashier requests access to this branch" value={settings.notifyNewCashierRequests} onChange={v => set('notifyNewCashierRequests', v)} />
          <ToggleRow label="Shift Closed Alerts" description="Notify when a cashier ends their shift" value={settings.notifyShiftClosed} onChange={v => set('notifyShiftClosed', v)} />
          <ToggleRow label="Cash Difference Alerts" description="Alert when closing cash does not match expected cash" value={settings.notifyCashDifference} onChange={v => set('notifyCashDifference', v)} />
          <ToggleRow label="Order Cancellation Alerts" description="Notify when an order is cancelled" value={settings.notifyOrderCancel} onChange={v => set('notifyOrderCancel', v)} />
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </SectionCard>

        {/* ══ 8. Security ══ */}
        <SectionCard id="security" icon={Lock} title="Security Settings" description="Configure access control and authentication policies for this branch.">
          <ToggleRow label="Require Password for Refunds" description="Cashiers must enter a supervisor password to process refunds" value={settings.requirePasswordRefund} onChange={v => set('requirePasswordRefund', v)} />
          <ToggleRow label="Require Password for Discounts" description="Cashiers must enter a supervisor password to apply discounts" value={settings.requirePasswordDiscount} onChange={v => set('requirePasswordDiscount', v)} />
          <ToggleRow label="Require Password for Price Override" description="Cashiers must enter a supervisor password to override prices" value={settings.requirePasswordPriceOverride} onChange={v => set('requirePasswordPriceOverride', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div className="form-group">
              <label className="form-label">Auto Logout Timer (minutes)</label>
              <select className="input" value={settings.autoLogoutTimer || 60} onChange={e => set('autoLogoutTimer', parseInt(e.target.value))}>
                {[5, 10, 15, 30, 60, 120].map(v => <option key={v} value={v}>{v} minutes</option>)}
              </select>
              <div className="form-hint">Automatically log out cashiers after this period of inactivity</div>
            </div>
            <div className="form-group">
              <label className="form-label">Idle Timeout (minutes)</label>
              <select className="input" value={settings.idleTimeout || 15} onChange={e => set('idleTimeout', parseInt(e.target.value))}>
                {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v} minutes</option>)}
              </select>
              <div className="form-hint">Lock the terminal after this period of no interaction</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save
            </button>
          </div>
        </SectionCard>

        {/* ══ 9. Backup & Sync ══ */}
        <SectionCard id="sync" icon={Database} title="Backup & Sync" description="View sync status and trigger a manual data synchronization with the server.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Last Sync Time', value: settings.lastSyncTime ? new Date(settings.lastSyncTime).toLocaleString('en-IN') : 'Never' },
              { label: 'Last Backup Time', value: settings.lastBackupTime ? new Date(settings.lastBackupTime).toLocaleString('en-IN') : 'Never' },
              { label: 'Database Status', value: settings.databaseStatus || 'Unknown', color: settings.databaseStatus === 'HEALTHY' ? '#10b981' : '#f87171' },
              { label: 'Internet Status', value: settings.internetStatus || 'Unknown', color: settings.internetStatus === 'ONLINE' ? '#10b981' : '#f87171' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Offline Mode</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Branch is operating in offline mode</div>
            </div>
            <ToggleSwitch checked={!!settings.offlineModeStatus} onChange={v => set('offlineModeStatus', v)} />
          </div>
          <button className="btn btn-primary" onClick={handleSync} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </SectionCard>

        {/* ══ 10. Profile ══ */}
        <SectionCard id="profile" icon={User} title="My Profile" description="Update your personal details and password.">
          {user?.profilePicture && (
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={user.profilePicture} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-400)' }} />
              <div>
                <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{user.email}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormInput label="Full Name" required value={profileForm.fullName} onChange={v => setProfileForm(p => ({ ...p, fullName: v }))} />
            <FormInput label="Phone Number" value={profileForm.phone} onChange={v => setProfileForm(p => ({ ...p, phone: v }))} />
            <div style={{ gridColumn: 'span 2' }}>
              <FormInput label="Email Address" type="email" required value={profileForm.email} onChange={v => setProfileForm(p => ({ ...p, email: v }))} />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input" placeholder="Leave blank to keep current"
                value={profileForm.password}
                onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))}
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 12, top: 34, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <FormInput label="Profile Picture URL" value={profileForm.profilePicture} onChange={v => setProfileForm(p => ({ ...p, profilePicture: v }))} hint="Paste an image URL (e.g. from Cloudinary or Imgur)" />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Update Profile
            </button>
          </div>
        </SectionCard>

        {/* ══ 11. About ══ */}
        <SectionCard id="about" icon={Info} title="About" description="System information and support contact details.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'POS Version',     value: 'v3.5.0' },
              { label: 'Build Version',   value: 'Build 2026.07.19' },
              { label: 'Branch ID',       value: `BR-${settings.branchId}` },
              { label: 'Store Name',      value: settings.storeName },
              { label: 'License Status',  value: '🟢 Active' },
              { label: 'Support Email',   value: 'support@pos-system.com' },
              { label: 'Support Phone',   value: '+91 98765 43210' },
              { label: 'Platform',        value: 'Spring Boot + React' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{value}</div>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
