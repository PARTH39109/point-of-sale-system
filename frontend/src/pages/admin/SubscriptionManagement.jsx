import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CheckCircle2, ShieldAlert, Crown, Zap, Rocket, AlertCircle, History, Infinity as InfinityIcon, X, ShieldCheck, XCircle, Info, Loader2 } from 'lucide-react'
import subscriptionService from '../../services/subscriptionService'
import { subscriptionPaymentService } from '../../services/subscriptionPaymentService'
import { selectUser } from '../../store/slices/authSlice'

const PLAN_ICONS = { BASIC: Zap, PRO: Crown, ADVANCE: Rocket }
const PLAN_ACCENTS = { BASIC: 'var(--text-secondary)', PRO: '#3b82f6', ADVANCE: '#8b5cf6' }

// Loads the Razorpay Checkout script on demand (once) rather than adding it
// to index.html globally — this page is the only place that needs it.
let razorpayScriptPromise = null
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)
  if (razorpayScriptPromise) return razorpayScriptPromise
  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => { razorpayScriptPromise = null; resolve(false) }
    document.body.appendChild(script)
  })
  return razorpayScriptPromise
}

export default function SubscriptionManagement() {
  const user = useSelector(selectUser)
  const [planData, setPlanData] = useState(null)
  const [usageData, setUsageData] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [allPlans, setAllPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upgrading, setUpgrading] = useState(false)

  // Payment flow
  const [upgradeModalPlan, setUpgradeModalPlan] = useState(null) // the plan being confirmed, or null
  const [paymentStep, setPaymentStep] = useState('idle') // idle | creating | awaiting | verifying
  const [toast, setToast] = useState(null) // { type: 'success'|'error'|'info', message }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [planRes, usageRes, historyRes, plansRes] = await Promise.all([
        subscriptionService.getMyPlan().catch(err => ({ data: null })),
        subscriptionService.getUsage().catch(err => ({ data: null })),
        subscriptionService.getHistory().catch(err => ({ data: [] })),
        subscriptionService.getAllPlans().catch(err => ({ data: [] })),
      ])
      setPlanData(planRes.data)
      setUsageData(usageRes.data)
      setHistoryData(historyRes.data || [])
      setAllPlans(plansRes.data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Failed to load subscription data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  const openUpgradeModal = (plan) => {
    setUpgradeModalPlan(plan)
  }

  const closeUpgradeModal = () => {
    if (paymentStep === 'awaiting' || paymentStep === 'verifying') return // don't close mid-flow
    setUpgradeModalPlan(null)
  }

  const proceedToPayment = async () => {
    if (!upgradeModalPlan) return
    setPaymentStep('creating')
    try {
      const orderRes = await subscriptionPaymentService.createOrder(upgradeModalPlan.id)
      const order = orderRes.data

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay checkout. Check your internet connection and try again.')
      }

      setPaymentStep('awaiting')

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'POS System',
        description: `Upgrade to ${order.planName}`,
        order_id: order.orderId,
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#3b82f6' },
        handler: async (response) => {
          setPaymentStep('verifying')
          try {
            const verifyRes = await subscriptionPaymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (verifyRes.data.success) {
              setToast({ type: 'success', message: verifyRes.data.message || 'Subscription upgraded successfully!' })
              setUpgradeModalPlan(null)
              await fetchData() // refresh plan card, usage, and payments — no page reload
            } else {
              setToast({ type: 'error', message: verifyRes.data.message || 'Payment verification failed. Your plan was not changed.' })
            }
          } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.message || 'Payment verification failed. Your plan was not changed.' })
          } finally {
            setPaymentStep('idle')
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStep('idle')
            setToast({ type: 'info', message: 'Payment cancelled. Your plan was not changed.' })
          }
        }
      })

      rzp.on('payment.failed', () => {
        setPaymentStep('idle')
        setToast({ type: 'error', message: 'Payment failed. Please try again.' })
      })

      rzp.open()
    } catch (err) {
      console.error(err)
      setPaymentStep('idle')
      setToast({ type: 'error', message: err.response?.data?.message || err.message || 'Failed to start payment.' })
    }
  }

  const handleRenew = async () => {
    if (!window.confirm(`Renew your current ${planData.planName} plan?`)) return
    setUpgrading(true)
    try {
      await subscriptionService.renewPlan()
      alert('Successfully renewed plan!')
      fetchData()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || "Failed to renew plan")
    } finally {
      setUpgrading(false)
    }
  }

  if (loading && !planData) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <div className="spinner"></div>
        </div>
    )
  }

  if (error) {
    return (
        <div className="empty-state">
          <AlertCircle size={48} color="var(--danger-text)" style={{ marginBottom: 16 }} />
          <h3>Error loading subscription</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: 16 }}>Retry</button>
        </div>
    )
  }

  const formatPrice = (price, durationMonths) => {
    if (!price || price === 0) return 'Free'
    const period = durationMonths === 12 ? 'year' : `${durationMonths} mo`
    return <>₹{price.toLocaleString('en-IN')}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/{period}</span></>
  }

  const ProgressBar = ({ label, used, max, percent }) => {
    if (max === null || max === undefined) {
      return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {used} <InfinityIcon size={14} /> Unlimited
            </span>
            </div>
            <div style={{ height: 8, background: 'var(--success-bg, rgba(16,185,129,0.15))', borderRadius: 4 }} />
          </div>
      )
    }
    const isWarning = percent >= 80
    const isDanger = percent >= 95
    const barColor = isDanger ? 'var(--danger-text)' : isWarning ? 'var(--warning-text)' : 'var(--brand-400)'

    return (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ color: isDanger ? 'var(--danger-text)' : 'var(--text-primary)' }}>
            {used} / {max} {isDanger && '(Limit Reached)'}
          </span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(percent, 100)}%`,
              background: barColor,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
    )
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Subscription & Licensing</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your SaaS plan, billing, and resource limits</p>
          </div>
        </div>

        {!planData.isUnlimited && planData.daysRemaining <= 14 && planData.daysRemaining > 0 && (
            <div style={{ padding: 16, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <ShieldAlert color="var(--warning-text)" size={24} />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--warning-text)', margin: 0, fontWeight: 600 }}>Plan Expiring Soon</h4>
                <p style={{ color: 'var(--warning-text)', margin: 0, fontSize: 14 }}>Your subscription will expire in {planData.daysRemaining} days. Please renew to avoid service interruption.</p>
              </div>
              <button className="btn btn-warning" onClick={handleRenew} disabled={upgrading}>
                {upgrading ? 'Processing...' : 'Renew Now'}
              </button>
            </div>
        )}

        {planData.status === 'EXPIRED' && (
            <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <AlertCircle color="var(--danger-text)" size={24} />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--danger-text)', margin: 0, fontWeight: 600 }}>Plan Expired</h4>
                <p style={{ color: 'var(--danger-text)', margin: 0, fontSize: 14 }}>Your subscription has expired. Creation of new resources is disabled.</p>
              </div>
              <button className="btn btn-danger" onClick={handleRenew} disabled={upgrading}>
                {upgrading ? 'Processing...' : 'Renew Now'}
              </button>
            </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Current Plan Overview */}
          <div className="card">
            <div className="card-header"><div className="card-title">Current Plan</div></div>

            <div style={{ padding: 24, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'var(--brand-500)', color: 'white', borderRadius: 20, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                {planData.subscriptionType === 'ADVANCE' ? <Rocket size={16} /> : planData.subscriptionType === 'PRO' ? <Crown size={16} /> : <Zap size={16} />}
                {planData.planName}
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatPrice(planData.price, 12)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Status</span>
              <span style={{ color: planData.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--danger-text)', fontWeight: 600, fontSize: 14 }}>
              {planData.status}
            </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Activated</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>
              {new Date(planData.startDate).toLocaleDateString()}
            </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Expires</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>
              {new Date(planData.endDate).toLocaleDateString()}
            </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Remaining</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>
              {planData.daysRemaining} Days
            </span>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="card">
            <div className="card-header"><div className="card-title">Resource Usage</div></div>
            <div style={{ marginTop: 8 }}>
              <ProgressBar label="Branches" used={usageData.usedBranches} max={usageData.maxBranches} percent={usageData.branchUsagePercent} />
              <ProgressBar label="Employees" used={usageData.usedEmployees} max={usageData.maxEmployees} percent={usageData.employeeUsagePercent} />
              <ProgressBar label="Products" used={usageData.usedProducts} max={usageData.maxProducts} percent={usageData.productUsagePercent} />
              <ProgressBar label="Customers" used={usageData.usedCustomers} max={usageData.maxCustomers} percent={usageData.customerUsagePercent} />
              <ProgressBar label="Monthly Orders" used={usageData.usedMonthlyOrders} max={usageData.maxMonthlyOrders} percent={usageData.orderUsagePercent} />
            </div>

            {!planData.isUnlimited && (usageData.branchUsagePercent >= 90 || usageData.employeeUsagePercent >= 90 || usageData.productUsagePercent >= 90) && (
                <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-text)', borderRadius: 8, fontSize: 13, marginTop: 16 }}>
                  <strong>Heads up!</strong> You are approaching your plan limits. Upgrade your plan to prevent service disruption.
                </div>
            )}
          </div>
        </div>

        {/* Upgrade Options — now fully data-driven from the backend */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 24 }}>
            <div className="card-title">Upgrade Plan</div>
            <div className="card-subtitle">Scale your business with higher limits</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {allPlans.map(plan => {
              const Icon = PLAN_ICONS[plan.type] || Zap
              const isCurrent = plan.type === planData.subscriptionType
              const accent = PLAN_ACCENTS[plan.type]
              return (
                  <div key={plan.type} style={{
                    border: isCurrent ? '2px solid var(--brand-500)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: 24, position: 'relative',
                    background: plan.type === 'ADVANCE' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' : undefined,
                  }}>
                    {isCurrent && (
                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-500)', color: 'white', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          CURRENT PLAN
                        </div>
                    )}
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: accent }}>
                      <Icon size={18} style={{ marginRight: 6, verticalAlign: -3 }} />{plan.name}
                    </h3>
                    <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
                      {formatPrice(plan.price, plan.durationMonths)}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                      <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {plan.isUnlimited ? 'Unlimited' : plan.maxBranches} Branches</li>
                      <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {plan.isUnlimited ? 'Unlimited' : plan.maxEmployees} Employees</li>
                      <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {plan.isUnlimited ? 'Unlimited' : plan.maxProducts.toLocaleString('en-IN')} Products</li>
                      <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {plan.isUnlimited ? 'Unlimited' : plan.maxMonthlyOrders.toLocaleString('en-IN')} Orders/mo</li>
                    </ul>
                    {!isCurrent && (
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', ...(plan.type === 'ADVANCE' ? { background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', border: 'none' } : {}) }}
                            disabled={upgrading || plan.price < planData.price}
                            onClick={() => openUpgradeModal(plan)}
                        >
                          {plan.price < planData.price ? 'Downgrade Unavailable' : `Upgrade to ${plan.name.replace(' Plan', '')}`}
                        </button>
                    )}
                  </div>
              )
            })}
          </div>
        </div>

        {/* Billing History */}
        <div className="card">
          <div className="card-header"><div className="card-title">Billing History</div></div>
          <div className="table-wrapper">
            <table>
              <thead>
              <tr><th>Date</th><th>Action</th><th>Plan</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
              {historyData.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-surface)', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        <History size={14} />{h.action}
                      </div>
                    </td>
                    <td>{h.plan.name}</td>
                    <td>{h.amountPaid === 0 ? 'Free' : `₹${h.amountPaid.toLocaleString('en-IN')}`}</td>
                    <td><span className="badge badge-success">Success</span></td>
                  </tr>
              ))}
              {historyData.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No billing history found</td></tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upgrade Confirmation Modal → Razorpay Checkout */}
        {upgradeModalPlan && (
            <div className="modal-overlay" onClick={closeUpgradeModal}>
              <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Confirm Upgrade</h3>
                  {paymentStep === 'idle' && (
                      <button onClick={closeUpgradeModal} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                  )}
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                  background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderRadius: 20,
                  fontSize: 12, fontWeight: 600, marginBottom: 16
                }}>
                  <ShieldCheck size={14} /> Razorpay Test Mode — no real money will be charged
                </div>

                <div style={{
                  padding: 20, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                  textAlign: 'center', marginBottom: 20
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: PLAN_ACCENTS[upgradeModalPlan.type] }}>
                    {upgradeModalPlan.name}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>
                    {formatPrice(upgradeModalPlan.price, upgradeModalPlan.durationMonths)}
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {upgradeModalPlan.isUnlimited ? 'Unlimited' : upgradeModalPlan.maxBranches} Branches</li>
                  <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {upgradeModalPlan.isUnlimited ? 'Unlimited' : upgradeModalPlan.maxEmployees} Employees</li>
                  <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {upgradeModalPlan.isUnlimited ? 'Unlimited' : upgradeModalPlan.maxProducts?.toLocaleString('en-IN')} Products</li>
                  <li><CheckCircle2 size={16} color="var(--success-text)" style={{ marginRight: 8, verticalAlign: 'middle' }} /> {upgradeModalPlan.isUnlimited ? 'Unlimited' : upgradeModalPlan.maxMonthlyOrders?.toLocaleString('en-IN')} Orders/month</li>
                </ul>

                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={closeUpgradeModal} disabled={paymentStep !== 'idle'}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={proceedToPayment} disabled={paymentStep !== 'idle'}>
                    {paymentStep === 'creating' && <><Loader2 size={16} className="spin" /> Creating order...</>}
                    {paymentStep === 'awaiting' && <><Loader2 size={16} className="spin" /> Waiting for payment...</>}
                    {paymentStep === 'verifying' && <><Loader2 size={16} className="spin" /> Verifying payment...</>}
                    {paymentStep === 'idle' && 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Toast */}
        {toast && (
            <div style={{
              position: 'fixed', top: 20, right: 20, zIndex: 1000,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', borderRadius: 'var(--radius-md)', minWidth: 280,
              background: toast.type === 'success' ? 'var(--success-bg, rgba(16,185,129,0.12))'
                  : toast.type === 'error' ? 'var(--danger-bg)' : 'var(--bg-elevated)',
              border: `1px solid ${toast.type === 'success' ? 'var(--success-text)' : toast.type === 'error' ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
              color: toast.type === 'success' ? 'var(--success-text)' : toast.type === 'error' ? 'var(--danger-text)' : 'var(--text-primary)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <XCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              <span style={{ fontSize: 14, flex: 1 }}>{toast.message}</span>
              <button onClick={() => setToast(null)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'inherit' }}>
                <X size={14} />
              </button>
            </div>
        )}

      </div>
  )
}