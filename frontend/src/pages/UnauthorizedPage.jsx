import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-base)',
    }}>
      <div style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--radius-xl)',
          background: 'var(--danger-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', border: '1px solid var(--danger-border)',
        }}>
          <ShieldX size={36} color="var(--danger-text)" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
          Access Denied
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
          You don't have permission to access this page.
          Please contact your administrator.
        </p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ gap: 8 }}>
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  )
}
