import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, ShoppingCart, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { loginStart, loginSuccess, loginFailure, selectAuthLoading, selectAuthError, clearError } from '../../store/slices/authSlice'
import { authService } from '../../services/authService'

export default function LoginPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const loading   = useSelector(selectAuthLoading)
  const authError = useSelector(selectAuthError)

  const [form, setForm]           = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]       = useState({})
  const [searchParams]            = useSearchParams()
  const redirectReason            = searchParams.get('reason')

  const from = location.state?.from?.pathname || '/'

  function validate() {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    dispatch(clearError())
    if (!validate()) return

    dispatch(loginStart())
    try {
      const { data } = await authService.login(form)
      dispatch(loginSuccess(data))

      // Route based on role
      const role = data.user?.role
      if (role === 'ROLE_ADMIN' || role === 'ROLE_STORE_ADMIN') {
        navigate('/admin/dashboard', { replace: true })
      } else if (role === 'ROLE_BRANCH_MANAGER' || role === 'ROLE_STORE_MANAGER') {
        navigate('/manager/dashboard', { replace: true })
      } else if (role === 'ROLE_CASHIER') {
        navigate('/cashier', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      dispatch(loginFailure(msg))
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ShoppingCart size={24} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              POS System
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Enterprise Edition</div>
          </div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-subheading">Sign in to your account to continue</p>

        {/* Redirect Reason Banner */}
        {redirectReason === 'session_expired' && (
          <div style={{
            background: 'var(--warning-bg, rgba(234,179,8,0.1))',
            border: '1px solid var(--warning-border, rgba(234,179,8,0.3))',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            color: 'var(--warning-text, #ca8a04)',
          }}>
            <AlertCircle size={16} />
            Your session expired. Please sign in again.
          </div>
        )}
        {redirectReason === 'access_denied' && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            color: 'var(--danger-text)',
          }}>
            <AlertCircle size={16} />
            Access denied. Please sign in again with correct credentials.
          </div>
        )}

        {/* Error Alert */}
        {authError && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            color: 'var(--danger-text)',
          }}>
            <AlertCircle size={16} />
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label required">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="email"
                className={`input ${errors.email ? 'error' : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && <span className="form-error"><AlertCircle size={12}/>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label required">Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{ paddingLeft: 40, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: 2,
                }}
              >
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errors.password && <span className="form-error"><AlertCircle size={12}/>{errors.password}</span>}
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? (
              <><Loader2 size={18} className="spin-icon" style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Don't have an account?</span>
        </div>

        <Link
          to="/register"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Create Account
        </Link>

        {/* Demo hint */}
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          background: 'var(--info-bg)',
          border: '1px solid var(--info-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--info-text)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          <strong>Roles:</strong> ROLE_ADMIN → Admin Panel &nbsp;|&nbsp; ROLE_BRANCH_MANAGER → Manager Dashboard &nbsp;|&nbsp; ROLE_CASHIER → Cashier Terminal
        </div>
      </div>
    </div>
  )
}
