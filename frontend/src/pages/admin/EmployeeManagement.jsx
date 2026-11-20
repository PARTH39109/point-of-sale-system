import React, { useEffect, useState } from 'react'
import { employeeService, cashierService } from '../../services/branchService'
import { UserCheck, Shield, Loader2, AlertCircle, Search, Users, Briefcase, Edit2, Trash2, X } from 'lucide-react'

export default function EmployeeManagement() {
  const [tab, setTab] = useState('EMPLOYEES') // EMPLOYEES | MANAGERS | CASHIERS
  const [employees, setEmployees] = useState([])
  const [managers, setManagers]   = useState([])
  const [cashiers, setCashiers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', isActive: true })
  const [saving, setSaving]     = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [empRes, mgrRes, cashRes] = await Promise.all([
        employeeService.getAllEmployees().catch(err => ({ data: [] })),
        employeeService.getManagers().catch(err => ({ data: [] })),
        cashierService.getAllCashiers().catch(err => ({ data: [] })),
      ])
      setEmployees(empRes.data || [])
      setManagers(mgrRes.data || [])
      setCashiers(cashRes.data || [])
    } catch (err) {
      console.error(err)
      const status = err?.response?.status
      if (!status || status >= 500 || status === 401 || status === 403) {
        setError(err?.response?.data?.message || 'Failed to load staff overview.')
      }
    } finally {
      setLoading(false)
    }
  }

  const listByTab = { EMPLOYEES: employees, MANAGERS: managers, CASHIERS: cashiers }
  const list = listByTab[tab]
  const manageable = tab !== 'EMPLOYEES' // Admin only edits/removes Managers & Cashiers here; plain staff belong to Branch Managers

  const filtered = list.filter(item =>
      item.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.designation?.toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(item) {
    setEditItem(item)
    setEditForm({ fullName: item.fullName || '', phone: item.phone || '', salary: item.salary ?? '', isActive: item.isActive !== false })
    setEditError('')
    setEditOpen(true)
  }

  async function submitEdit(e) {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    const payload = { ...editForm, salary: editForm.salary !== '' ? parseFloat(editForm.salary) : null }
    try {
      if (tab === 'MANAGERS') {
        await employeeService.updateManager(editItem.id, payload)
      } else {
        await cashierService.updateCashier(editItem.id, payload)
      }
      setEditOpen(false)
      loadData()
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const label = tab === 'MANAGERS' ? 'Branch Manager' : 'Cashier'
    if (!window.confirm(`Remove this ${label}? They will lose login access immediately.`)) return
    try {
      if (tab === 'MANAGERS') {
        await employeeService.deleteManager(item.id)
      } else {
        await cashierService.deleteCashier(item.id)
      }
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || `Failed to remove ${label.toLowerCase()}.`)
    }
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Workforce Overview</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            View all staff, and manage Branch Manager / Cashier accounts across every branch.
          </p>
        </div>

        {error && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)',
            }}>
              <AlertCircle size={16} />{error}
            </div>
        )}

        <div className="card" style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${tab === 'EMPLOYEES' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('EMPLOYEES')}>
              <Users size={14} /> Employees ({employees.length})
            </button>
            <button className={`btn btn-sm ${tab === 'MANAGERS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('MANAGERS')}>
              <Shield size={14} /> Branch Managers ({managers.length})
            </button>
            <button className={`btn btn-sm ${tab === 'CASHIERS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('CASHIERS')}>
              <Briefcase size={14} /> Cashiers ({cashiers.length})
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 20px' }}>
          <div className="input-with-icon" style={{ maxWidth: 400 }}>
            <Search size={16} className="input-icon" />
            <input type="text" className="input" placeholder="Search by name, email, or designation..."
                   value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={36} style={{ animation: 'spin 0.7s linear infinite' }} />
            </div>
        ) : filtered.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon"><UserCheck size={32} /></div>
              <h3 className="empty-state-title">No records found</h3>
              <p className="empty-state-desc">
                {tab === 'EMPLOYEES' && 'Staff are added by each branch\u2019s manager and will show up here.'}
                {tab === 'MANAGERS' && 'Branch Managers appear here once their access request is approved.'}
                {tab === 'CASHIERS' && 'Cashiers are added by their Branch Manager and will show up here.'}
              </p>
            </div>
        ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table>
                  <thead>
                  <tr>
                    <th>Name</th>
                    {tab === 'EMPLOYEES' ? <th>Designation</th> : <th>Email</th>}
                    <th>Branch</th>
                    <th>Salary</th>
                    <th>Status</th>
                    {manageable && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm">
                              {item.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{item.fullName}</span>
                          </div>
                        </td>
                        {tab === 'EMPLOYEES'
                            ? <td>{item.designation || '-'}</td>
                            : <td style={{ color: 'var(--text-secondary)' }}>{item.email}</td>}
                        <td><span style={{ color: 'var(--text-secondary)' }}>{item.branchName || 'Unassigned'}</span></td>
                        <td><strong>{item.salary ? `₹${item.salary.toLocaleString()}` : '-'}</strong></td>
                        <td>
                      <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                        </td>
                        {manageable && (
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm btn-icon" title="Edit" onClick={() => openEdit(item)}>
                                  <Edit2 size={13} />
                                </button>
                                <button className="btn btn-danger btn-sm btn-icon" title="Remove" onClick={() => handleDelete(item)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                        )}
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {/* Edit Modal — shared by Managers and Cashiers */}
        {editOpen && editItem && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">Edit {tab === 'MANAGERS' ? 'Branch Manager' : 'Cashier'}</h3>
                  <button onClick={() => setEditOpen(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>

                {editError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger-text)' }}>
                      {editError}
                    </div>
                )}

                <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input className="input" required value={editForm.fullName}
                           onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="input" value={editForm.phone}
                           onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Salary</label>
                    <div className="input-with-icon">
                      <span className="input-icon" style={{ top: '50%' }}>₹</span>
                      <input type="number" className="input" style={{ paddingLeft: 28 }}
                             value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} />
                    </div>
                  </div>
                    
                  {tab === 'CASHIERS' && (
                      <div className="form-group">
                        <label className="form-label">New Password (leave blank to keep unchanged)</label>
                        <input type="password" className="input" placeholder="••••••"
                               onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
                      </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="input" value={editForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                            onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'ACTIVE' })}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="modal-footer">
                    <button type="button" onClick={() => setEditOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  )
}