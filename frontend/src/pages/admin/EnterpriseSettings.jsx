import { useState, useEffect } from 'react'
import { 
  Building2, Store, Percent, CreditCard, Globe, Bell, 
  ShieldCheck, History, Info, Save, RefreshCw, CheckCircle2, 
  AlertCircle, Lock, Server, Users, Package, Clock, Eye, EyeOff
} from 'lucide-react'
import storeSettingsService from '../../services/storeSettingsService'
import { branchService } from '../../services/branchService'

export default function EnterpriseSettings() {
  const [activeTab, setActiveTab] = useState('business')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Settings form state
  const [formData, setFormData] = useState({
    storeName: '',
    logoUrl: '',
    legalBusinessName: '',
    businessType: 'Retail',
    gstNumber: '',
    panNumber: '',
    registeredAddress: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    supportEmail: '',
    supportPhone: '',
    website: '',
    businessDescription: '',

    defaultBranchId: '',
    branchCodePrefix: 'BR',
    autoGenerateBranchCode: true,
    defaultBranchStatus: 'ACTIVE',
    maxEmployeesPerBranch: 5,

    razorpayKeyId: '',
    razorpaySecretKey: '',
    razorpayWebhookSecret: '',
    razorpayTestMode: true,
    enableOnlinePayments: false,

    enableGst: true,
    taxPricingType: 'EXCLUSIVE',
    defaultGstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    invoiceTaxNotes: '',

    notifyEmailNewEmployee: true,
    notifyEmailNewBranch: true,
    notifyEmailSubExpiry: true,
    notifyEmailDailyReport: false,
    notifyEmailWeeklyReport: true,
    notifyEmailMonthlyReport: true,

    notifySysLowStock: true,
    notifySysBranchCreated: true,
    notifySysEmployeeAdded: true,
    notifySysPaymentReceived: true,
    notifySysFailedPayment: true,

    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    timezone: 'Asia/Kolkata',
    language: 'English',
    numberFormat: 'en-IN',
    financialYearStart: 'April'
  })

  // Auxiliary data
  const [branches, setBranches] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [aboutData, setAboutData] = useState(null)
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  useEffect(() => {
    loadSettingsData()
  }, [])

  const loadSettingsData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [settingsRes, branchesRes, aboutRes, auditRes] = await Promise.all([
        storeSettingsService.getSettings().catch(() => ({ data: {} })),
        branchService.getAllBranches().catch(() => ({ data: [] })),
        storeSettingsService.getAboutStore().catch(() => ({ data: null })),
        storeSettingsService.getAuditLogs().catch(() => ({ data: [] }))
      ])

      if (settingsRes?.data) {
        setFormData(prev => ({
          ...prev,
          ...settingsRes.data,
          defaultBranchId: settingsRes.data.defaultBranchId || ''
        }))
      }

      setBranches(branchesRes?.data || [])
      setAboutData(aboutRes?.data || null)
      setAuditLogs(auditRes?.data || [])
    } catch (err) {
      console.error(err)
      setErrorMsg('Failed to load store settings.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const payload = {
        ...formData,
        defaultBranchId: formData.defaultBranchId ? Number(formData.defaultBranchId) : null,
        defaultGstRate: Number(formData.defaultGstRate) || 0,
        cgstRate: Number(formData.cgstRate) || 0,
        sgstRate: Number(formData.sgstRate) || 0,
        igstRate: Number(formData.igstRate) || 0
      }
      const res = await storeSettingsService.updateSettings(payload)
      if (res?.data) {
        setFormData(prev => ({ ...prev, ...res.data }))
      }
      setSuccessMsg('Store settings saved successfully!')
      // Refresh audit logs
      storeSettingsService.getAuditLogs().then(r => setAuditLogs(r.data || [])).catch(() => {})
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordSuccess('')
    setPasswordError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.')
      setPasswordSaving(false)
      return
    }

    try {
      await storeSettingsService.changePassword(passwordForm)
      setPasswordSuccess('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(''), 4000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: 'var(--text-secondary)' }}>
        <RefreshCw size={24} className="spin" /> Loading Enterprise Settings...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Enterprise Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure global policies, tax, branch defaults & security across your store</p>
        </div>
        <button className="btn btn-secondary" onClick={loadSettingsData} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Navigation Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Sidebar Navigation */}
        <div className="card" style={{ padding: '8px' }}>
          <button 
            className={`btn ${activeTab === 'business' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('business')}
          >
            <Building2 size={18} /> Business Profile
          </button>
          <button 
            className={`btn ${activeTab === 'branch_defaults' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('branch_defaults')}
          >
            <Store size={18} /> Branch Defaults
          </button>
          <button 
            className={`btn ${activeTab === 'tax' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('tax')}
          >
            <Percent size={18} /> Tax & GST
          </button>
          <button 
            className={`btn ${activeTab === 'payments' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('payments')}
          >
            <CreditCard size={18} /> Payment Gateway
          </button>
          <button 
            className={`btn ${activeTab === 'regional' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('regional')}
          >
            <Globe size={18} /> Regional & Currency
          </button>
          <button 
            className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> Notifications
          </button>
          <button 
            className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('security')}
          >
            <ShieldCheck size={18} /> Security & Password
          </button>
          <button 
            className={`btn ${activeTab === 'audit_logs' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
            onClick={() => setActiveTab('audit_logs')}
          >
            <History size={18} /> Audit Logs
          </button>
          <button 
            className={`btn ${activeTab === 'about' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setActiveTab('about')}
          >
            <Info size={18} /> About Store
          </button>
        </div>

        {/* Settings Form Container */}
        <div className="card">
          {activeTab !== 'security' && activeTab !== 'audit_logs' && activeTab !== 'about' && (
            <form onSubmit={handleSaveSettings}>
              
              {/* TAB 1: BUSINESS PROFILE */}
              {activeTab === 'business' && (
                <div>
                  <div className="card-header" style={{ marginBottom: 20 }}>
                    <div className="card-title">Business Profile</div>
                    <div className="card-subtitle">Official company details, branding, GSTIN and registered contact information.</div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label required">Store / Brand Name</label>
                      <input className="input" name="storeName" value={formData.storeName || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Legal Business Name</label>
                      <input className="input" name="legalBusinessName" value={formData.legalBusinessName || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Business Type</label>
                      <select className="input" name="businessType" value={formData.businessType || 'Retail'} onChange={handleChange}>
                        <option value="Retail">Retail Store</option>
                        <option value="Supermarket">Supermarket / Grocery</option>
                        <option value="Electronics">Electronics & Hardware</option>
                        <option value="Fashion">Apparel & Fashion</option>
                        <option value="Restaurant">Restaurant / Cafe</option>
                        <option value="Wholesale">Wholesale & Distribution</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">GST Identification Number (GSTIN)</label>
                      <input className="input" name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} placeholder="29GGGGG1314R9Z6" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number</label>
                      <input className="input" name="panNumber" value={formData.panNumber || ''} onChange={handleChange} placeholder="ABCDE1234F" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Support Phone</label>
                      <input className="input" name="supportPhone" value={formData.supportPhone || ''} onChange={handleChange} placeholder="+91 9876543210" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Support Email</label>
                      <input type="email" className="input" name="supportEmail" value={formData.supportEmail || ''} onChange={handleChange} placeholder="admin@store.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website URL</label>
                      <input type="url" className="input" name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://myposstore.com" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Logo URL</label>
                      <input className="input" name="logoUrl" value={formData.logoUrl || ''} onChange={handleChange} placeholder="https://example.com/logo.png" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Registered Office Address</label>
                      <textarea className="input" rows="2" name="registeredAddress" value={formData.registeredAddress || ''} onChange={handleChange} placeholder="123 Commercial St, Business Bay" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="input" name="city" value={formData.city || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input className="input" name="state" value={formData.state || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input className="input" name="pincode" value={formData.pincode || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input className="input" name="country" value={formData.country || 'India'} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BRANCH DEFAULTS */}
              {activeTab === 'branch_defaults' && (
                <div>
                  <div className="card-header" style={{ marginBottom: 20 }}>
                    <div className="card-title">Branch Defaults</div>
                    <div className="card-subtitle">Set global rules and default configurations for newly provisioned branches.</div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Default Primary Branch</label>
                      <select className="input" name="defaultBranchId" value={formData.defaultBranchId || ''} onChange={handleChange}>
                        <option value="">-- None Selected --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.branchCode})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Code Prefix</label>
                      <input className="input" name="branchCodePrefix" value={formData.branchCodePrefix || 'BR'} onChange={handleChange} placeholder="BR" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Branch Initial Status</label>
                      <select className="input" name="defaultBranchStatus" value={formData.defaultBranchStatus || 'ACTIVE'} onChange={handleChange}>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Employees Per Branch (Subscription Limit)</label>
                      <input className="input" value={formData.maxEmployeesPerBranch || 5} disabled style={{ opacity: 0.7 }} />
                      <div className="form-hint">Controlled by your store subscription plan.</div>
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <input 
                          type="checkbox" 
                          id="autoGen" 
                          name="autoGenerateBranchCode" 
                          checked={!!formData.autoGenerateBranchCode} 
                          onChange={handleChange} 
                          style={{ width: 18, height: 18 }}
                        />
                        <label htmlFor="autoGen" style={{ fontWeight: 500, cursor: 'pointer' }}>
                          Auto-generate branch codes (e.g. BR-001, BR-002) when adding new locations
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TAX & GST */}
              {activeTab === 'tax' && (
                <div>
                  <div className="card-header" style={{ marginBottom: 20 }}>
                    <div className="card-title">Tax & GST Settings</div>
                    <div className="card-subtitle">Configure tax rates, pricing tax behavior (inclusive/exclusive), and GST rules.</div>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <input 
                        type="checkbox" 
                        id="enableGst" 
                        name="enableGst" 
                        checked={!!formData.enableGst} 
                        onChange={handleChange} 
                        style={{ width: 18, height: 18 }}
                      />
                      <label htmlFor="enableGst" style={{ fontWeight: 600, cursor: 'pointer' }}>
                        Enable GST Calculation on POS Checkout and Invoices
                      </label>
                    </div>

                    {formData.enableGst && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                        <div className="form-group">
                          <label className="form-label">Tax Pricing Model</label>
                          <select className="input" name="taxPricingType" value={formData.taxPricingType || 'EXCLUSIVE'} onChange={handleChange}>
                            <option value="EXCLUSIVE">EXCLUSIVE (Tax added on top of item price at checkout)</option>
                            <option value="INCLUSIVE">INCLUSIVE (Item prices already include GST)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Default GST Rate (%)</label>
                          <input type="number" step="0.1" className="input" name="defaultGstRate" value={formData.defaultGstRate ?? 18} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CGST Rate (%)</label>
                          <input type="number" step="0.1" className="input" name="cgstRate" value={formData.cgstRate ?? 9} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">SGST Rate (%)</label>
                          <input type="number" step="0.1" className="input" name="sgstRate" value={formData.sgstRate ?? 9} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">IGST Rate (%) - Inter-State Transactions</label>
                          <input type="number" step="0.1" className="input" name="igstRate" value={formData.igstRate ?? 18} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Invoice Tax Notes & Disclaimer</label>
                          <textarea className="input" rows="2" name="invoiceTaxNotes" value={formData.invoiceTaxNotes || ''} onChange={handleChange} placeholder="Tax invoice issued under Section 31 of CGST Act 2017." />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENT GATEWAY */}
              {activeTab === 'payments' && (
                <div>
                  <div className="card-header" style={{ marginBottom: 20 }}>
                    <div className="card-title">Payment Gateway (Razorpay)</div>
                    <div className="card-subtitle">Connect your Razorpay account to collect online payments, UPI, and cards.</div>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <input 
                        type="checkbox" 
                        id="onlinePay" 
                        name="enableOnlinePayments" 
                        checked={!!formData.enableOnlinePayments} 
                        onChange={handleChange} 
                        style={{ width: 18, height: 18 }}
                      />
                      <label htmlFor="onlinePay" style={{ fontWeight: 600, cursor: 'pointer' }}>
                        Enable Online Payments & Digital Gateways
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      <input 
                        type="checkbox" 
                        id="testMode" 
                        name="razorpayTestMode" 
                        checked={!!formData.razorpayTestMode} 
                        onChange={handleChange} 
                        style={{ width: 18, height: 18 }}
                      />
                      <label htmlFor="testMode" style={{ fontWeight: 500, cursor: 'pointer' }}>
                        Razorpay Sandbox / Test Mode (Use test API keys)
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Razorpay Key ID</label>
                        <input className="input" name="razorpayKeyId" value={formData.razorpayKeyId || ''} onChange={handleChange} placeholder="rzp_test_..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Razorpay Key Secret</label>
                        <input type="password" className="input" name="razorpaySecretKey" value={formData.razorpaySecretKey || ''} onChange={handleChange} placeholder="Enter key secret" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Webhook Secret</label>
                        <input type="password" className="input" name="razorpayWebhookSecret" value={formData.razorpayWebhookSecret || ''} onChange={handleChange} placeholder="Enter webhook secret" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: REGIONAL & CURRENCY */}
              {activeTab === 'regional' && (
                <div>
                  <div className="card-header" style={{ marginBottom: 20 }}>
                    <div className="card-title">Regional & Localization</div>
                    <div className="card-subtitle">Define store currency, date/time formats, timezone and financial calendar.</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Default Currency</label>
                      <select className="input" name="currency" value={formData.currency || 'INR'} onChange={handleChange}>
                        <option value="INR">INR (Indian Rupee)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                        <option value="AED">AED (UAE Dirham)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency Symbol</label>
                      <input className="input" name="currencySymbol" value={formData.currencySymbol || '₹'} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date Format</label>
                      <select className="input" name="dateFormat" value={formData.dateFormat || 'DD/MM/YYYY'} onChange={handleChange}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/07/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/24/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-07-24)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time Format</label>
                      <select className="input" name="timeFormat" value={formData.timeFormat || '12h'} onChange={handleChange}>
                        <option value="12h">12-Hour (AM/PM)</option>
                        <option value="24h">24-Hour Military</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timezone</label>
                      <select className="input" name="timezone" value={formData.timezone || 'Asia/Kolkata'} onChange={handleChange}>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="UTC">UTC (+0:00)</option>
                        <option value="America/New_York">America/New_York (EST -5:00)</option>
                        <option value="Europe/London">Europe/London (GMT +0:00)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Financial Year Start</label>
                      <select className="input" name="financialYearStart" value={formData.financialYearStart || 'April'} onChange={handleChange}>
                        <option value="April">April (April 1 - March 31)</option>
                        <option value="January">January (Jan 1 - Dec 31)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="card-header" style={{ marginBottom: 20 }}>
                    <div className="card-title">Email & System Notifications</div>
                    <div className="card-subtitle">Configure automated email dispatches and real-time dashboard notifications.</div>
                  </div>

                  <div style={{ display: 'grid', gap: 20 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Email Dispatch Preferences</h4>
                      <div style={{ display: 'grid', gap: 10, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifyEmailNewEmployee" checked={!!formData.notifyEmailNewEmployee} onChange={handleChange} />
                          New Employee Welcome & Credentials Email
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifyEmailNewBranch" checked={!!formData.notifyEmailNewBranch} onChange={handleChange} />
                          Branch Creation Confirmation Emails
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifyEmailSubExpiry" checked={!!formData.notifyEmailSubExpiry} onChange={handleChange} />
                          Subscription Expiry & Renewal Alerts
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifyEmailWeeklyReport" checked={!!formData.notifyEmailWeeklyReport} onChange={handleChange} />
                          Weekly Sales & Profitability Digest
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifyEmailMonthlyReport" checked={!!formData.notifyEmailMonthlyReport} onChange={handleChange} />
                          Monthly Executive Performance Report
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>System & In-App Alert Triggers</h4>
                      <div style={{ display: 'grid', gap: 10, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifySysLowStock" checked={!!formData.notifySysLowStock} onChange={handleChange} />
                          Trigger Low Stock & Inventory Exhaustion Alerts
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifySysBranchCreated" checked={!!formData.notifySysBranchCreated} onChange={handleChange} />
                          Notify when a Manager creates or modifies a branch
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifySysEmployeeAdded" checked={!!formData.notifySysEmployeeAdded} onChange={handleChange} />
                          Notify when Cashier or Staff accounts are registered
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input type="checkbox" name="notifySysPaymentReceived" checked={!!formData.notifySysPaymentReceived} onChange={handleChange} />
                          Notify on Successful High-Value Online Payment
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Save Button Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

            </form>
          )}

          {/* TAB 7: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div>
              <div className="card-header" style={{ marginBottom: 20 }}>
                <div className="card-title">Security & Account Password</div>
                <div className="card-subtitle">Update your Store Admin credentials and enforce account security.</div>
              </div>

              {passwordSuccess && (
                <div style={{ padding: '12px 16px', marginBottom: 16, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={18} /> {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div style={{ padding: '12px 16px', marginBottom: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} /> {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ maxWidth: 500, display: 'grid', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showCurrentPw ? 'text' : 'password'} 
                      className="input" 
                      value={passwordForm.currentPassword} 
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                      required 
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showNewPw ? 'text' : 'password'} 
                      className="input" 
                      value={passwordForm.newPassword} 
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                      required 
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                    required 
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                    {passwordSaving ? <RefreshCw size={16} className="spin" /> : <Lock size={16} />}
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: AUDIT LOGS */}
          {activeTab === 'audit_logs' && (
            <div>
              <div className="card-header" style={{ marginBottom: 20 }}>
                <div className="card-title">System Audit Logs</div>
                <div className="card-subtitle">Track administrative actions, setting changes, and security events across your store.</div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="empty-state">
                  <History size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
                  <h4>No Audit Trail Recorded Yet</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>Administrative changes and security events will automatically appear here.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px 12px' }}>Timestamp</th>
                        <th style={{ padding: '10px 12px' }}>User</th>
                        <th style={{ padding: '10px 12px' }}>Action</th>
                        <th style={{ padding: '10px 12px' }}>Module</th>
                        <th style={{ padding: '10px 12px' }}>Details</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-tertiary)' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{log.userEmail || 'System'}</td>
                          <td style={{ padding: '10px 12px' }}><span className="badge badge-neutral">{log.action}</span></td>
                          <td style={{ padding: '10px 12px' }}>{log.module}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{log.details}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className={`badge ${log.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: ABOUT STORE */}
          {activeTab === 'about' && aboutData && (
            <div>
              <div className="card-header" style={{ marginBottom: 20 }}>
                <div className="card-title">About Store & SaaS Metadata</div>
                <div className="card-subtitle">High-level enterprise summary, subscription health, and build details.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>STORE NAME</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{aboutData.storeName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>ID: #{aboutData.storeId}</div>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>SUBSCRIPTION PLAN</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>{aboutData.subscriptionPlan}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{aboutData.daysRemaining} days remaining</div>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>STORE OWNER</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{aboutData.storeOwner}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{aboutData.ownerEmail}</div>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>DATABASE STATUS</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Server size={16} /> {aboutData.databaseStatus}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>API {aboutData.apiVersion}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} /> Resource Usage
                  </h4>
                  <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Branches Registered:</span>
                      <span style={{ fontWeight: 600 }}>{aboutData.numberOfBranches}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Staff / Employees:</span>
                      <span style={{ fontWeight: 600 }}>{aboutData.numberOfEmployees}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Products Cataloged:</span>
                      <span style={{ fontWeight: 600 }}>{aboutData.numberOfProducts}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} /> Build Metadata
                  </h4>
                  <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Application Build:</span>
                      <span style={{ fontWeight: 500 }}>{aboutData.applicationVersion}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Store Created:</span>
                      <span style={{ fontWeight: 500 }}>{aboutData.createdOn ? new Date(aboutData.createdOn).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Last Settings Update:</span>
                      <span style={{ fontWeight: 500 }}>{aboutData.lastUpdated ? new Date(aboutData.lastUpdated).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

