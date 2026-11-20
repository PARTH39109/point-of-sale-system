import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, ShoppingCart, Mail, Lock, User, Phone, Loader2, AlertCircle, CheckCircle2, Store, Building2 } from 'lucide-react'
import { loginStart, loginSuccess, loginFailure, selectAuthLoading, selectAuthError, clearError } from '../../store/slices/authSlice'
import { authService } from '../../services/authService'

const AVAILABLE_ROLES = [
  { value: 'ROLE_STORE_ADMIN',    label: 'Store Admin'     },
  { value: 'ROLE_BRANCH_MANAGER', label: 'Branch Manager'  },
  { value: 'ROLE_STORE_MANAGER',  label: 'Store Manager'   },
  { value: 'ROLE_CASHIER',        label: 'Cashier'         },
]

export default function RegisterPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const loading   = useSelector(selectAuthLoading)
  const authError = useSelector(selectAuthError)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'ROLE_CASHIER',
    storeName: '',
    storeId: '',
    branchId: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]             = useState({})

  // Both Branch Manager and Cashier go through the access-request flow now
  const isAccessRequestRole = form.role === 'ROLE_BRANCH_MANAGER' || form.role === 'ROLE_CASHIER'
  const isStoreAdmin = form.role === 'ROLE_STORE_ADMIN'

  const [stores, setStores]               = useState([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [branches, setBranches]           = useState([])
  const [branchesLoading, setBranchesLoading] = useState(false)

  const [requestSubmitted, setRequestSubmitted] = useState(false)

  useEffect(() => {
    if (!isAccessRequestRole || stores.length > 0 || storesLoading) return

    let cancelled = false
    setStoresLoading(true)
    authService.getRegistrationStores()
        .then(({ data }) => { if (!cancelled) setStores(data || []) })
        .catch(() => { if (!cancelled) setErrors(e => ({ ...e, storeId: 'Could not load stores' })) })
        .finally(() => { if (!cancelled) setStoresLoading(false) })

    return () => { cancelled = true }
  }, [isAccessRequestRole]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAccessRequestRole || !form.storeId) {
      setBranches([])
      return
    }

    let cancelled = false
    setBranchesLoading(true)
    setBranches([])
    authService.getRegistrationBranches(form.storeId)
        .then(({ data }) => { if (!cancelled) setBranches(data || []) })
        .catch(() => { if (!cancelled) setErrors(e => ({ ...e, branchId: 'Could not load branches' })) })
        .finally(() => { if (!cancelled) setBranchesLoading(false) })

    return () => { cancelled = true }
  }, [form.storeId, isAccessRequestRole])

  function handleRoleChange(role) {
    setForm({ ...form, role, storeId: '', branchId: '', storeName: '' })
    setErrors({})
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim())    e.fullName = 'Full name is required'
    if (!form.email)              e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password)           e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!form.role)               e.role     = 'Role is required'

    if (isAccessRequestRole) {
      if (!form.storeId)  e.storeId  = 'Please select a store'
      if (!form.branchId) e.branchId = 'Please select a branch'
    }

    if (isStoreAdmin && !form.storeName.trim()) {
      e.storeName = 'Store name is required'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(clearError())
    if (!validate()) return

    dispatch(loginStart())

    if (isAccessRequestRole) {
      try {
        await authService.requestAccess({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          storeId: form.storeId,
          branchId: form.branchId,
        })
        dispatch(loginFailure(null))
        setRequestSubmitted(true)
      } catch (err) {
        dispatch(loginFailure(err.response?.data?.message || 'Failed to submit access request.'))
      }
      return
    }

    const { confirmPassword, storeId, branchId, ...payload } = form
    try {
      const { data } = await authService.register(payload)
      dispatch(loginSuccess(data))
      const role = data.user?.role
      if (role === 'ROLE_ADMIN' || role === 'ROLE_STORE_ADMIN') navigate('/admin/dashboard', { replace: true })
      else if (role === 'ROLE_BRANCH_MANAGER' || role === 'ROLE_STORE_MANAGER') navigate('/manager/dashboard', { replace: true })
      else navigate('/cashier', { replace: true })
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Registration failed.'))
    }
  }

  const field = (id, label, icon, type = 'text', placeholder = '', key) => (
      <div className="form-group">
        <label className="form-label required">{label}</label>
        <div className="input-with-icon">
          <span className="input-icon">{icon}</span>
          <input
              id={id}
              type={type}
              className={`input ${errors[key] ? 'error' : ''}`}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
        {errors[key] && <span className="form-error"><AlertCircle size={12}/>{errors[key]}</span>}
      </div>
  )

  if (requestSubmitted) {
    return (
        <div className="auth-page">
          <div className="auth-bg-gradient" />
          <div className="auth-card" style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--success-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <CheckCircle2 size={28} color="var(--success-text)" />
            </div>
            <h1 className="auth-heading">Request Submitted</h1>
            <p className="auth-subheading">
              Your {form.role === 'ROLE_CASHIER' ? 'Cashier' : 'Branch Manager'} access request has been sent to the{' '}
              {form.role === 'ROLE_CASHIER' ? 'Branch Manager' : 'Store Admin'} for approval.
              You'll be able to sign in once it's approved.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
              Back to Sign In
            </Link>
          </div>
        </div>
    )
  }

  return (
      <div className="auth-page">
        <div className="auth-bg-gradient" />

        <div className="auth-card" style={{ maxWidth: 480 }}>
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <ShoppingCart size={24} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>POS System</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Enterprise Edition</div>
            </div>
          </div>

          <h1 className="auth-heading">Create Account</h1>
          <p className="auth-subheading">Join your team on the POS platform</p>

          {authError && (
              <div style={{
                background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)',
              }}>
                <AlertCircle size={16} />{authError}
              </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {field('reg-name',  'Full Name',    <User  size={16}/>, 'text',     'John Smith',        'fullName')}
            {field('reg-email', 'Email Address',<Mail  size={16}/>, 'email',    'you@company.com',   'email')}
            {field('reg-phone', 'Phone Number', <Phone size={16}/>, 'tel',      '+91 98765 43210',   'phone')}

            <div className="form-group">
              <label className="form-label required">Role</label>
              <select
                  id="reg-role"
                  className={`input ${errors.role ? 'error' : ''}`}
                  value={form.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
              >
                {AVAILABLE_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.role && <span className="form-error"><AlertCircle size={12}/>{errors.role}</span>}
            </div>

            {isStoreAdmin && (
                <div className="form-group">
                  <label className="form-label required">Store Name</label>
                  <div className="input-with-icon">
                    <Store size={16} className="input-icon" />
                    <input
                        id="reg-store-name"
                        type="text"
                        className={`input ${errors.storeName ? 'error' : ''}`}
                        style={{ paddingLeft: 40 }}
                        placeholder="e.g. Parth Mart"
                        value={form.storeName}
                        onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    />
                  </div>
                  {errors.storeName && <span className="form-error"><AlertCircle size={12}/>{errors.storeName}</span>}
                </div>
            )}

            {isAccessRequestRole && (
                <>
                  <div className="form-group">
                    <label className="form-label required">Available Mart</label>
                    <div className="input-with-icon">
                      <Store size={16} className="input-icon" />
                      <select
                          id="reg-store"
                          className={`input ${errors.storeId ? 'error' : ''}`}
                          style={{ paddingLeft: 40 }}
                          value={form.storeId}
                          onChange={(e) => setForm({ ...form, storeId: e.target.value, branchId: '' })}
                          disabled={storesLoading}
                      >
                        <option value="">{storesLoading ? 'Loading stores…' : 'Select a store'}</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.brand}</option>
                        ))}
                      </select>
                      {storesLoading && (
                          <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 0.7s linear infinite' }} />
                      )}
                    </div>
                    {errors.storeId && <span className="form-error"><AlertCircle size={12}/>{errors.storeId}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Available Branch</label>
                    <div className="input-with-icon">
                      <Building2 size={16} className="input-icon" />
                      <select
                          id="reg-branch"
                          className={`input ${errors.branchId ? 'error' : ''}`}
                          style={{ paddingLeft: 40 }}
                          value={form.branchId}
                          onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                          disabled={!form.storeId || branchesLoading}
                      >
                        <option value="">
                          {!form.storeId ? 'Select a store first' : branchesLoading ? 'Loading branches…' : 'Select a branch'}
                        </option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      {branchesLoading && (
                          <Loader2 size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 0.7s linear infinite' }} />
                      )}
                    </div>
                    {errors.branchId && <span className="form-error"><AlertCircle size={12}/>{errors.branchId}</span>}
                    {form.storeId && !branchesLoading && branches.length === 0 && (
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No branches found for this store.</span>
                    )}
                  </div>
                </>
            )}

            <div className="form-group">
              <label className="form-label required">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={16} className="input-icon" />
                <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input ${errors.password ? 'error' : ''}`}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2 }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <span className="form-error"><AlertCircle size={12}/>{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                    id="reg-confirm"
                    type="password"
                    className={`input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
              {errors.confirmPassword && <span className="form-error"><AlertCircle size={12}/>{errors.confirmPassword}</span>}
            </div>

            <button id="reg-submit" type="submit" className="btn btn-primary btn-lg"
                    disabled={loading} style={{ width: '100%', marginTop: 6 }}>
              {loading
                  ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }}/> {isAccessRequestRole ? 'Submitting Request…' : 'Creating Account…'}</>
                  : (isAccessRequestRole ? 'Request Access' : 'Create Account')}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>

          <Link to="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Sign In
          </Link>
        </div>
      </div>
  )
}