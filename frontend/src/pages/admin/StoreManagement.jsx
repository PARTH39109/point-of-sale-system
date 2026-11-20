import React, { useEffect, useState } from 'react'
import { storeService } from '../../services/authService'
import { Store, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function StoreManagement() {
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    brand: '',
    description: '',
    storeType: '',
    contact: {
      address: '',
      phone: '',
      email: '',
    },
  })

  useEffect(() => {
    loadStore()
  }, [])

  async function loadStore() {
    setLoading(true)
    try {
      const { data } = await storeService.getMyStore()
      if (data) {
        setStore(data)
        setForm({
          brand: data.brand || '',
          description: data.description || '',
          storeType: data.storeType || '',
          contact: {
            address: data.contact?.address || '',
            phone: data.contact?.phone || '',
            email: data.contact?.email || '',
          },
        })
      }
    } catch (err) {
      setError('Failed to fetch store details.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      if (store?.id) {
        const { data } = await storeService.updateStore(store.id, form)
        setStore(data)
      } else {
        const { data } = await storeService.createStore(form)
        setStore(data)
      }
      setSuccess('Store profile saved successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store details.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={36} className="spin-icon" style={{ animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--brand-600), var(--brand-400))',
              display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
            }}>
              <Store size={22} color="white" />
            </div>
            <div>
              <h2 className="card-title">Store Profile Settings</h2>
              <p className="card-subtitle">Manage your enterprise brand identity and settings</p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '20px 0 0',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)',
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '20px 0 0',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--success-text)',
          }}>
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label required">Brand Name</label>
              <input
                id="store-brand"
                type="text"
                className="input"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Store Type / Industry</label>
              <input
                id="store-type"
                type="text"
                className="input"
                placeholder="Retail, Grocery, Electronics..."
                value={form.storeType}
                onChange={(e) => setForm({ ...form, storeType: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="store-desc"
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="divider" />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: -10 }}>
            Contact & Address Details
          </h3>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Store Email</label>
              <input
                id="store-email"
                type="email"
                className="input"
                value={form.contact.email}
                onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Store Phone</label>
              <input
                id="store-phone"
                type="text"
                className="input"
                value={form.contact.phone}
                onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Store Address</label>
            <input
              id="store-address"
              type="text"
              className="input"
              value={form.contact.address}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              id="store-save"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >
              {saving ? (
                <><Loader2 size={16} className="spin-icon" style={{ animation: 'spin 0.7s linear infinite' }} /> Saving Changes…</>
              ) : (
                <><Save size={16} /> Save Settings</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
