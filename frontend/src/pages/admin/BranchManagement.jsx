import React, { useEffect, useState } from 'react'
import { branchService } from '../../services/branchService'
import { Plus, Edit2, Trash2, Building2, MapPin, Phone, Mail, Loader2, AlertCircle, X, Search } from 'lucide-react'

export default function BranchManagement() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    setLoading(true)
    setError('')
    try {
      const { data } = await branchService.getAllBranches()
      setBranches(data || [])
    } catch (err) {
      console.error(err)
      const status = err?.response?.status
      if (!status || status >= 500 || status === 401 || status === 403) {
        setError(err?.response?.data?.message || 'Failed to load branches.')
      } else {
        setBranches([])
      }
    } finally {
      setLoading(false)
    }
  }

  function handleOpenAdd() {
    setModalMode('add')
    setCurrentId(null)
    setForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      managerName: '',
      isActive: true,
    })
    setShowModal(true)
  }

  function handleOpenEdit(b) {
    setModalMode('edit')
    setCurrentId(b.id)
    setForm({
      name: b.name || '',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      managerName: b.managerName || '',
      isActive: b.isActive !== false,
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (modalMode === 'add') {
        await branchService.createBranch(form)
      } else {
        await branchService.updateBranch(currentId, form)
      }
      setShowModal(false)
      loadBranches()
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving branch details.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this branch?')) return

    try {
      await branchService.deleteBranch(id)
      loadBranches()
    } catch (err) {
      setError('Failed to delete branch. Check if employees are assigned to it.')
    }
  }

  const filtered = branches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.managerName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Branches</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage store locations, managers, and branch contacts</p>
        </div>
        <button id="add-branch-btn" onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Branch
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Search Input */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div className="input-with-icon" style={{ maxWidth: 400 }}>
          <Search size={16} className="input-icon" />
          <input
            id="search-branch"
            type="text"
            className="input"
            placeholder="Search branches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={36} className="spin-icon" style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <Building2 size={32} />
          </div>
          <h3 className="empty-state-title">No branches found</h3>
          <p className="empty-state-desc">Create your first branch location to configure registers and employees.</p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Add Branch
          </button>
        </div>
      ) : (
        <div className="grid-cols-3">
          {filtered.map(b => (
            <div className="card" key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: 'var(--info-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info-text)'
                  }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{b.name}</h3>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Manager: {b.managerName || 'Unassigned'}</span>
                  </div>
                </div>
                <span className={`badge ${b.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                {b.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} />
                    <span>{b.phone}</span>
                  </div>
                )}
                {b.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} />
                    <span>{b.email}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  id={`edit-branch-${b.id}`}
                  onClick={() => handleOpenEdit(b)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  id={`delete-branch-${b.id}`}
                  onClick={() => handleDelete(b.id)}
                  className="btn btn-danger btn-sm btn-icon"
                  title="Delete Branch"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'add' ? 'Add New Branch' : 'Edit Branch'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label required">Branch Name</label>
                <input
                  id="branch-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manager Name</label>
                <input
                  id="branch-manager"
                  type="text"
                  className="input"
                  value={form.managerName}
                  onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Branch Email</label>
                <input
                  id="branch-email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Branch Phone</label>
                <input
                  id="branch-phone"
                  type="text"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  id="branch-address"
                  type="text"
                  className="input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input
                  id="branch-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="branch-active" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Branch location is active and open
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button id="branch-submit" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><Loader2 size={14} className="spin-icon" style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                  ) : (
                    'Save Branch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
