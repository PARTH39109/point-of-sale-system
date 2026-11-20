import { useEffect, useState } from 'react'
import { employeeService, cashierService } from '../../services/branchService'
import {
  UserCheck, Search, Users, Briefcase, Eye, Plus,
  Loader2, AlertCircle, X, Calendar, Phone, Mail, Building2, Trash2, Pencil
} from 'lucide-react'

const DESIGNATIONS = [
  'Employee', 'Sales Staff', 'Housekeeping', 'Security',
  'Stock Keeper', 'Helper', 'Delivery Boy', 'Other',
]

const EMPTY_EMPLOYEE_FORM = { fullName: '', phone: '', designation: 'Employee', salary: '', joiningDate: '', notes: '', isActive: true }
const EMPTY_CASHIER_FORM  = { fullName: '', email: '', password: '', phone: '', salary: '' }

export default function BranchEmployees() {
  const [tab, setTab] = useState('EMPLOYEES') // EMPLOYEES | CASHIERS

  const [employees, setEmployees] = useState([])
  const [cashiers, setCashiers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const [empModalOpen, setEmpModalOpen] = useState(false)
  const [empForm, setEmpForm] = useState(EMPTY_EMPLOYEE_FORM)
  const [empSaving, setEmpSaving] = useState(false)
  const [empError, setEmpError] = useState('')

  const [cashierModalOpen, setCashierModalOpen] = useState(false)
  const [cashierForm, setCashierForm] = useState(EMPTY_CASHIER_FORM)
  const [cashierSaving, setCashierSaving] = useState(false)
  const [cashierError, setCashierError] = useState('')

  // ── Edit state ──
  const [editEmpModalOpen, setEditEmpModalOpen] = useState(false)
  const [editEmpId, setEditEmpId] = useState(null)
  const [editEmpForm, setEditEmpForm] = useState(EMPTY_EMPLOYEE_FORM)
  const [editEmpSaving, setEditEmpSaving] = useState(false)
  const [editEmpError, setEditEmpError] = useState('')

  const [editCashierModalOpen, setEditCashierModalOpen] = useState(false)
  const [editCashierId, setEditCashierId] = useState(null)
  const [editCashierForm, setEditCashierForm] = useState({ fullName: '', phone: '', salary: '' })
  const [editCashierSaving, setEditCashierSaving] = useState(false)
  const [editCashierError, setEditCashierError] = useState('')

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [empRes, cashRes] = await Promise.all([
        employeeService.getAllEmployees(),
        cashierService.getAllCashiers(),
      ])
      setEmployees(empRes.data || [])
      setCashiers(cashRes.data || [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const list = tab === 'EMPLOYEES' ? employees : cashiers

  const filtered = list.filter(item => {
    if (statusFilter === 'ACTIVE' && !item.isActive) return false
    if (statusFilter === 'INACTIVE' && item.isActive) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
          item.fullName?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.designation?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const activeCount   = employees.filter(e => e.isActive).length
  const cashierActive = cashiers.filter(c => c.isActive).length

  function openDetails(item) {
    setSelected(item)
    setDetailsOpen(true)
  }

  // ── Add Employee ──
  function openAddEmployee() {
    setEmpForm(EMPTY_EMPLOYEE_FORM)
    setEmpError('')
    setEmpModalOpen(true)
  }

  async function submitEmployee(e) {
    e.preventDefault()
    setEmpSaving(true)
    setEmpError('')
    try {
      await employeeService.createEmployee({
        ...empForm,
        salary: empForm.salary ? parseFloat(empForm.salary) : null,
        joiningDate: empForm.joiningDate ? `${empForm.joiningDate}T00:00:00` : null,
      })
      setEmpModalOpen(false)
      fetchAll()
    } catch (err) {
      setEmpError(err.response?.data?.message || 'Failed to add employee.')
    } finally {
      setEmpSaving(false)
    }
  }

  async function removeEmployee(id) {
    if (!window.confirm('Remove this staff record?')) return
    try {
      await employeeService.deleteEmployee(id)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove employee.')
    }
  }

  // ── Add Cashier ──
  function openAddCashier() {
    setCashierForm(EMPTY_CASHIER_FORM)
    setCashierError('')
    setCashierModalOpen(true)
  }

  async function submitCashier(e) {
    e.preventDefault()
    setCashierSaving(true)
    setCashierError('')
    try {
      await cashierService.createCashier({
        ...cashierForm,
        salary: cashierForm.salary ? parseFloat(cashierForm.salary) : null,
      })
      setCashierModalOpen(false)
      fetchAll()
    } catch (err) {
      setCashierError(err.response?.data?.message || 'Failed to add cashier.')
    } finally {
      setCashierSaving(false)
    }
  }

  function openEditEmployee(item) {
    setEditEmpId(item.id)
    setEditEmpForm({
      fullName: item.fullName || '',
      phone: item.phone || '',
      designation: item.designation || 'Employee',
      salary: item.salary || '',
      joiningDate: item.joiningDate ? item.joiningDate.split('T')[0] : '',
      notes: item.notes || '',
      isActive: item.isActive ?? true,
    })
    setEditEmpError('')
    setEditEmpModalOpen(true)
  }

  async function submitEditEmployee(e) {
    e.preventDefault()
    setEditEmpSaving(true)
    setEditEmpError('')
    try {
      await employeeService.updateEmployee(editEmpId, {
        ...editEmpForm,
        salary: editEmpForm.salary ? parseFloat(editEmpForm.salary) : null,
        joiningDate: editEmpForm.joiningDate ? `${editEmpForm.joiningDate}T00:00:00` : null,
      })
      setEditEmpModalOpen(false)
      fetchAll()
    } catch (err) {
      setEditEmpError(err.response?.data?.message || 'Failed to update employee.')
    } finally {
      setEditEmpSaving(false)
    }
  }

  function openEditCashier(item) {
    setEditCashierId(item.id)
    setEditCashierForm({
      fullName: item.fullName || '',
      phone: item.phone || '',
      salary: item.salary || '',
    })
    setEditCashierError('')
    setEditCashierModalOpen(true)
  }

  async function submitEditCashier(e) {
    e.preventDefault()
    setEditCashierSaving(true)
    setEditCashierError('')
    try {
      await cashierService.updateCashier(editCashierId, {
        fullName: editCashierForm.fullName,
        phone: editCashierForm.phone,
        salary: editCashierForm.salary ? parseFloat(editCashierForm.salary) : null,
      })
      setEditCashierModalOpen(false)
      fetchAll()
    } catch (err) {
      setEditCashierError(err.response?.data?.message || 'Failed to update cashier.')
    } finally {
      setEditCashierSaving(false)
    }
  }

  async function removeCashier(id) {
    if (!window.confirm('Remove this cashier account? They will lose login access immediately.')) return
    try {
      await cashierService.deleteCashier(id)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove cashier.')
    }
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stats Row */}
        <div className="grid-cols-4">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#3b82f6)' }}>
              <Users size={20} color="white" />
            </div>
            <div className="stat-card-value">{employees.length}</div>
            <div className="stat-card-label">Staff Records</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#059669,#34d399)' }}>
              <UserCheck size={20} color="white" />
            </div>
            <div className="stat-card-value">{activeCount}</div>
            <div className="stat-card-label">Active Staff</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
              <Briefcase size={20} color="white" />
            </div>
            <div className="stat-card-value">{cashiers.length}</div>
            <div className="stat-card-label">Cashiers</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}>
              <UserCheck size={20} color="white" />
            </div>
            <div className="stat-card-value">{cashierActive}</div>
            <div className="stat-card-label">Active Cashiers</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn btn-sm ${tab === 'EMPLOYEES' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('EMPLOYEES')}>
                Employees
              </button>
              <button className={`btn btn-sm ${tab === 'CASHIERS' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('CASHIERS')}>
                Cashiers
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {tab === 'EMPLOYEES' ? (
                  <button id="add-employee-btn" onClick={openAddEmployee} className="btn btn-primary btn-sm">
                    <Plus size={14} /> Add Employee
                  </button>
              ) : (
                  <button id="add-cashier-btn" onClick={openAddCashier} className="btn btn-primary btn-sm">
                    <Plus size={14} /> Add Cashier
                  </button>
              )}
            </div>
          </div>

          {error && (
              <div style={{
                background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px', margin: '0 20px 16px',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)',
              }}>
                <AlertCircle size={16} />{error}
              </div>
          )}

          {/* Toolbar */}
          <div className="table-toolbar">
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
              <div className="input-with-icon" style={{ maxWidth: 300, flex: 1 }}>
                <Search className="input-icon" />
                <input
                    type="text"
                    className="input"
                    placeholder={tab === 'EMPLOYEES' ? 'Search by name or designation...' : 'Search by name or email...'}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" size={32} color="var(--brand-400)" /></div>
            ) : (
                <table>
                  <thead>
                  <tr>
                    <th>{tab === 'EMPLOYEES' ? 'Employee' : 'Cashier'}</th>
                    {tab === 'EMPLOYEES' ? <th>Designation</th> : <th>Email</th>}
                    <th>Phone</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.length > 0 ? filtered.map(item => {
                    const initials = item.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'
                    return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {initials}
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.fullName}</div>
                            </div>
                          </td>
                          {tab === 'EMPLOYEES' ? <td>{item.designation}</td> : <td style={{ color: 'var(--text-secondary)' }}>{item.email}</td>}
                          <td style={{ color: 'var(--text-secondary)' }}>{item.phone || '-'}</td>
                          <td><strong>{item.salary ? `₹${item.salary.toLocaleString()}` : '-'}</strong></td>
                          <td>
                        <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>
                          <span className="badge-dot" />{item.isActive ? 'Active' : 'Inactive'}
                        </span>
                          </td>
                          <td><span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{item.joiningDate ? new Date(item.joiningDate).toLocaleDateString() : '-'}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-sm btn-icon" title="View Details" onClick={() => openDetails(item)}>
                                <Eye size={16} />
                              </button>
                              <button
                                  className="btn btn-secondary btn-sm btn-icon"
                                  title={tab === 'EMPLOYEES' ? 'Edit Employee' : 'Edit Cashier'}
                                  onClick={() => tab === 'EMPLOYEES' ? openEditEmployee(item) : openEditCashier(item)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                  className="btn btn-danger btn-sm btn-icon"
                                  title={tab === 'EMPLOYEES' ? 'Remove Employee' : 'Remove Cashier'}
                                  onClick={() => tab === 'EMPLOYEES' ? removeEmployee(item.id) : removeCashier(item.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                    )
                  }) : (
                      <tr>
                        <td colSpan="7">
                          <div className="empty-state">
                            <Users size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
                            <h3>No {tab === 'EMPLOYEES' ? 'employees' : 'cashiers'} found</h3>
                            <p>Try adjusting your search, or add a new one.</p>
                          </div>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
            )}
          </div>
        </div>

        {/* ── Add Employee Modal (no email/password) ── */}
        {empModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">Add Employee</h3>
                  <button onClick={() => setEmpModalOpen(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>

                {empError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger-text)' }}>
                      {empError}
                    </div>
                )}

                <form onSubmit={submitEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input className="input" required value={empForm.fullName}
                           onChange={e => setEmpForm({ ...empForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Phone Number</label>
                    <input className="input" required value={empForm.phone}
                           onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label required">Employee Role</label>
                      <select className="input" value={empForm.designation}
                              onChange={e => setEmpForm({ ...empForm, designation: e.target.value })}>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Monthly Salary</label>
                      <div className="input-with-icon">
                        <span className="input-icon" style={{ top: '50%' }}>₹</span>
                        <input type="number" className="input" style={{ paddingLeft: 28 }} required
                               value={empForm.salary} onChange={e => setEmpForm({ ...empForm, salary: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Joining Date</label>
                      <input type="date" className="input" value={empForm.joiningDate}
                             onChange={e => setEmpForm({ ...empForm, joiningDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="input" value={empForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                              onChange={e => setEmpForm({ ...empForm, isActive: e.target.value === 'ACTIVE' })}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="input" rows={2} value={empForm.notes}
                              onChange={e => setEmpForm({ ...empForm, notes: e.target.value })} />
                  </div>

                  <div className="modal-footer">
                    <button type="button" onClick={() => setEmpModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={empSaving}>
                      {empSaving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</> : 'Save Employee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ── Add Cashier Modal (has login credentials) ── */}
        {cashierModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">Add Cashier</h3>
                  <button onClick={() => setCashierModalOpen(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>

                {cashierError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger-text)' }}>
                      {cashierError}
                    </div>
                )}

                <form onSubmit={submitCashier} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input className="input" required value={cashierForm.fullName}
                           onChange={e => setCashierForm({ ...cashierForm, fullName: e.target.value })} />
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label required">Email (Login)</label>
                      <input type="email" className="input" required value={cashierForm.email}
                             onChange={e => setCashierForm({ ...cashierForm, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Password</label>
                      <input type="password" className="input" required value={cashierForm.password}
                             onChange={e => setCashierForm({ ...cashierForm, password: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="input" value={cashierForm.phone}
                             onChange={e => setCashierForm({ ...cashierForm, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Salary</label>
                      <div className="input-with-icon">
                        <span className="input-icon" style={{ top: '50%' }}>₹</span>
                        <input type="number" className="input" style={{ paddingLeft: 28 }}
                               value={cashierForm.salary} onChange={e => setCashierForm({ ...cashierForm, salary: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Branch and Store are assigned automatically to your branch — Role is set to Cashier.
                  </p>

                  <div className="modal-footer">
                    <button type="button" onClick={() => setCashierModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={cashierSaving}>
                      {cashierSaving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</> : 'Save Cashier'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ── Edit Employee Modal ── */}
        {editEmpModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">Edit Employee</h3>
                  <button onClick={() => setEditEmpModalOpen(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>
                {editEmpError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger-text)' }}>
                      {editEmpError}
                    </div>
                )}
                <form onSubmit={submitEditEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input className="input" required value={editEmpForm.fullName} onChange={e => setEditEmpForm({ ...editEmpForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="input" value={editEmpForm.phone} onChange={e => setEditEmpForm({ ...editEmpForm, phone: e.target.value })} />
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="input" value={editEmpForm.designation} onChange={e => setEditEmpForm({ ...editEmpForm, designation: e.target.value })}>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Salary</label>
                      <div className="input-with-icon">
                        <span className="input-icon" style={{ top: '50%' }}>₹</span>
                        <input type="number" className="input" style={{ paddingLeft: 28 }} value={editEmpForm.salary} onChange={e => setEditEmpForm({ ...editEmpForm, salary: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Joining Date</label>
                      <input type="date" className="input" value={editEmpForm.joiningDate} onChange={e => setEditEmpForm({ ...editEmpForm, joiningDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select className="input" value={editEmpForm.isActive ? 'ACTIVE' : 'INACTIVE'} onChange={e => setEditEmpForm({ ...editEmpForm, isActive: e.target.value === 'ACTIVE' })}>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="input" rows={2} value={editEmpForm.notes} onChange={e => setEditEmpForm({ ...editEmpForm, notes: e.target.value })} />
                  </div>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setEditEmpModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={editEmpSaving}>
                      {editEmpSaving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ── Edit Cashier Modal ── */}
        {editCashierModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">Edit Cashier</h3>
                  <button onClick={() => setEditCashierModalOpen(false)} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>
                {editCashierError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger-text)' }}>
                      {editCashierError}
                    </div>
                )}
                <form onSubmit={submitEditCashier} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input className="input" required value={editCashierForm.fullName} onChange={e => setEditCashierForm({ ...editCashierForm, fullName: e.target.value })} />
                  </div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="input" value={editCashierForm.phone} onChange={e => setEditCashierForm({ ...editCashierForm, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Salary</label>
                      <div className="input-with-icon">
                        <span className="input-icon" style={{ top: '50%' }}>₹</span>
                        <input type="number" className="input" style={{ paddingLeft: 28 }} value={editCashierForm.salary} onChange={e => setEditCashierForm({ ...editCashierForm, salary: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Email and password can only be changed by the cashier themselves via settings.</p>
                  <div className="modal-footer">
                    <button type="button" onClick={() => setEditCashierModalOpen(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={editCashierSaving}>
                      {editCashierSaving ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Details Modal */}
        {detailsOpen && selected && (
            <div className="modal-overlay" onClick={() => setDetailsOpen(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title">{tab === 'EMPLOYEES' ? 'Employee Profile' : 'Cashier Profile'}</div>
                  <button className="btn btn-ghost btn-icon" onClick={() => setDetailsOpen(false)}><X size={20} /></button>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-600), var(--brand-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {selected.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selected.fullName}</h2>
                    <span className={`badge ${selected.isActive ? 'badge-success' : 'badge-danger'}`}>{selected.isActive ? 'Active' : 'Inactive'}</span>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>{selected.designation || 'Cashier'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--bg-elevated)', padding: 20, borderRadius: 'var(--radius-md)' }}>
                  {tab === 'CASHIERS' && (
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> Email</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.email}</div>
                      </div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> Phone</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} /> Branch</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.branchName || 'Unassigned'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Joined</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.joiningDate ? new Date(selected.joiningDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  {tab === 'EMPLOYEES' && selected.notes && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 14 }}>{selected.notes}</div>
                      </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setDetailsOpen(false)}>Close</button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}