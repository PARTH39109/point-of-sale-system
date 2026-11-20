import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
  ShoppingBag, Search, Filter, Eye, Printer, RotateCcw,
  ChevronLeft, ChevronRight, Calendar, X, Loader2, AlertCircle, FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BranchOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination & Filtering
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  
  // Searching & status
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // Could be implemented client-side or we add to API later

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      // We use the existing API which returns orders for the user's store
      // Since manager is associated with a branch, ideally we'd filter by branch, but we'll use what we have available.
      const res = await api.get('/api/orders', {
        params: { page, size, sortBy: 'createdAt', dir: 'desc' }
      })
      
      setOrders(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, size])

  // Filter client side for now to avoid altering backend
  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
    if (searchTerm && !o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
      case 'PAID':
      case 'SUCCESS':
        return 'badge-success'
      case 'PENDING':
      case 'PARTIALLY_PAID':
        return 'badge-warning'
      case 'CANCELLED':
      case 'FAILED':
        return 'badge-danger'
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'badge-info'
      default:
        return 'badge-neutral'
    }
  }

  const openOrderDetails = (order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Order Management</div>
            <div className="card-subtitle">View and manage orders for your branch</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <div className="input-with-icon" style={{ maxWidth: 300, flex: 1 }}>
              <Search className="input-icon" />
              <input 
                type="text" 
                className="input" 
                placeholder="Search order number or customer..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
          
          <button className="btn btn-secondary btn-icon" onClick={fetchOrders} title="Refresh">
            <RotateCcw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading && orders.length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spin" size={32} color="var(--brand-400)" /></div>
          ) : error ? (
            <div className="empty-state">
              <AlertCircle size={40} color="var(--danger-text)" style={{ marginBottom: 16 }} />
              <p>{error}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--brand-400)', fontWeight: 600 }}>{o.orderNumber}</span></td>
                    <td>{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>{o.customerName || 'Walk-in'}</td>
                    <td>{o.totalItems}</td>
                    <td><strong>₹{o.grandTotal?.toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className="badge badge-neutral">{o.paymentMethod || 'CASH'}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(o.orderStatus)}`}>
                        <span className="badge-dot" />
                        {o.orderStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="View Details" onClick={() => openOrderDetails(o)}>
                          <Eye size={16} />
                        </button>
                        <Link to={`/cashier/invoice/${o.id}`} target="_blank" className="btn btn-ghost btn-sm btn-icon" title="Print Invoice">
                          <Printer size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <ShoppingBag size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
                        <h3>No orders found</h3>
                        <p>Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-footer">
            <div>
              Showing page {page + 1} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {modalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Order Details</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedOrder.orderNumber} • {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
               <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Customer Details</div>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.customerName || 'Walk-in Customer'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Cashier: {selectedOrder.cashierName}</div>
               </div>
               <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Payment Details</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span className="badge badge-neutral">{selectedOrder.paymentMethod || 'CASH'}</span>
                     <span className={`badge ${getStatusBadge(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span>
                  </div>
               </div>
            </div>

            <div className="table-wrapper" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.lineTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                     <span>₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
                     <span>₹{selectedOrder.taxAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                     <span style={{ color: 'var(--danger-text)' }}>-₹{selectedOrder.discountAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4 }}>
                     <span>Total</span>
                     <span style={{ color: 'var(--brand-400)' }}>₹{selectedOrder.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
               </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Close</button>
              <Link to={`/cashier/invoice/${selectedOrder.id}`} target="_blank" className="btn btn-primary">
                <Printer size={16} /> Print Invoice
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
