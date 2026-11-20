import React, { useEffect, useState } from 'react'
import { accessRequestService } from '../../services/authService'
import { UserCheck, Check, X, Loader2, AlertCircle, Store, Building2, Clock } from 'lucide-react'

const STATUS_TABS = [
    { value: '',         label: 'All'      },
    { value: 'PENDING',  label: 'Pending'  },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
]

function StatusBadge({ status }) {
    const map = {
        PENDING:  'badge-warning',
        APPROVED: 'badge-success',
        REJECTED: 'badge-danger',
    }
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>
}

export default function AccessRequests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState('')
    const [statusFilter, setStatusFilter] = useState('PENDING')

    const [actingId, setActingId]   = useState(null)
    const [rejectingId, setRejectingId] = useState(null)
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        loadRequests()
    }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

    async function loadRequests() {
        setLoading(true)
        setError('')
        try {
            const { data } = await accessRequestService.getRequests(statusFilter)
            setRequests(data || [])
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load access requests.')
        } finally {
            setLoading(false)
        }
    }

    async function handleApprove(id) {
        setActingId(id)
        setError('')
        try {
            await accessRequestService.approveRequest(id)
            await loadRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve this request.')
        } finally {
            setActingId(null)
        }
    }

    function handleOpenReject(id) {
        setRejectingId(id)
        setRejectReason('')
    }

    async function handleConfirmReject(id) {
        setActingId(id)
        setError('')
        try {
            await accessRequestService.rejectRequest(id, rejectReason || undefined)
            setRejectingId(null)
            await loadRequests()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject this request.')
        } finally {
            setActingId(null)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>Access Requests</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Review and approve Branch Manager access requests
                    </p>
                </div>
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

            <div className="card" style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`btn btn-sm ${statusFilter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                    <Loader2 size={36} className="spin-icon" style={{ animation: 'spin 0.7s linear infinite' }} />
                </div>
            ) : requests.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-state-icon">
                        <UserCheck size={32} />
                    </div>
                    <h3 className="empty-state-title">No access requests</h3>
                    <p className="empty-state-desc">Pending sign-up requests for your team will show up here.</p>
                </div>
            ) : (
                <div className="table-container">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Requested Role</th>
                                <th>Store</th>
                                <th>Branch</th>
                                <th>Status</th>
                                <th>Requested Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {requests.map(req => (
                                <React.Fragment key={req.id}>
                                    <tr>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar avatar-sm">
                                                    {req.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{req.fullName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{req.email}</span>
                                                {req.phone && <span style={{ color: 'var(--text-tertiary)' }}>{req.phone}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral">
                                                     {req.requestedRole === 'ROLE_CASHIER' ? 'Cashier' : 'Branch Manager'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                                                <Store size={13} /> {req.storeName || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                                                <Building2 size={13} /> {req.branchName || '-'}
                                            </div>
                                        </td>
                                        <td><StatusBadge status={req.status} /></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 13 }}>
                                                <Clock size={13} />
                                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {req.status === 'PENDING' ? (
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button
                                                        id={`approve-req-${req.id}`}
                                                        onClick={() => handleApprove(req.id)}
                                                        className="btn btn-primary btn-sm btn-icon"
                                                        title="Approve"
                                                        disabled={actingId === req.id}
                                                    >
                                                        {actingId === req.id ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Check size={13} />}
                                                    </button>
                                                    <button
                                                        id={`reject-req-${req.id}`}
                                                        onClick={() => handleOpenReject(req.id)}
                                                        className="btn btn-danger btn-sm btn-icon"
                                                        title="Reject"
                                                        disabled={actingId === req.id}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {req.status === 'REJECTED' && req.rejectionReason ? req.rejectionReason : '—'}
                          </span>
                                            )}
                                        </td>
                                    </tr>

                                    {rejectingId === req.id && (
                                        <tr>
                                            <td colSpan={8}>
                                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 4px' }}>
                                                    <input
                                                        id={`reject-reason-${req.id}`}
                                                        type="text"
                                                        className="input"
                                                        placeholder="Rejection reason (optional)"
                                                        value={rejectReason}
                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                        style={{ maxWidth: 360 }}
                                                    />
                                                    <button
                                                        onClick={() => handleConfirmReject(req.id)}
                                                        className="btn btn-danger btn-sm"
                                                        disabled={actingId === req.id}
                                                    >
                                                        {actingId === req.id ? 'Rejecting…' : 'Confirm Reject'}
                                                    </button>
                                                    <button onClick={() => setRejectingId(null)} className="btn btn-secondary btn-sm">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}