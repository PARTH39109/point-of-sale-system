import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
  AlertTriangle, Package, RefreshCw, X, CheckCircle,
  ShoppingCart, Loader2, AlertCircle, Bell, TrendingDown
} from 'lucide-react'

export default function BranchLowStock() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [requestQty, setRequestQty] = useState(10)
  const [requestNotes, setRequestNotes] = useState('')

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/inventory/me/low-stock')
      // Sort: Out of stock first, then ascending by quantity
      const sorted = res.data.sort((a, b) => {
        if (a.quantity === 0 && b.quantity > 0) return -1
        if (b.quantity === 0 && a.quantity > 0) return 1
        return a.quantity - b.quantity
      })
      setAlerts(sorted)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch low stock alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const outOfStock = alerts.filter(a => a.quantity === 0)
  const lowStock = alerts.filter(a => a.quantity > 0 && a.quantity <= a.minStockLevel)

  const openRequestModal = (item) => {
    setSelectedProduct(item)
    setRequestQty(Math.max(item.maxStockLevel - item.quantity, 10))
    setRequestNotes('')
    setModalOpen(true)
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    // For Phase 6, we just simulate the request and close
    alert(`Restock request sent for ${selectedProduct.productName} (Qty: ${requestQty})`)
    setModalOpen(false)
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {alerts.length > 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(248,113,113,0.1), rgba(220,38,38,0.05))',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger-text)' }}>
                  <Bell size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger-text)', marginBottom: 4 }}>Attention Required</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>You have <strong>{outOfStock.length}</strong> items out of stock and <strong>{lowStock.length}</strong> running low.</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={fetchAlerts} title="Refresh">
                <RefreshCw size={18} className={loading ? 'spin' : ''} />
              </button>
            </div>
        ) : !loading && !error && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(5,150,105,0.05))',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
              textAlign: 'center', minHeight: 250
            }}>
              <CheckCircle size={56} color="var(--success-text)" />
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--success-text)' }}>All Clear!</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>Your branch inventory is healthy. There are no low stock or out-of-stock items currently.</p>
              <button className="btn btn-secondary" onClick={fetchAlerts} style={{ marginTop: 8 }}>
                <RefreshCw size={16} /> Check Again
              </button>
            </div>
        )}

        {loading && alerts.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 className="spin" size={32} color="var(--brand-400)" /></div>
        )}

        {error && (
            <div className="empty-state">
              <AlertCircle size={48} color="var(--danger-text)" style={{ marginBottom: 16 }} />
              <h3>Error Loading Alerts</h3>
              <p>{error}</p>
            </div>
        )}

        {/* OUT OF STOCK SECTION */}
        {outOfStock.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--danger-border)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={20} color="var(--danger-text)" />
                    <span style={{ color: 'var(--danger-text)' }}>CRITICAL: Out of Stock</span>
                    <span className="badge badge-danger">{outOfStock.length} items</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                {outOfStock.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 'var(--radius-md)',
                      borderLeft: '4px solid var(--danger-text)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="var(--text-tertiary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.productName}</div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span>SKU: {item.productSku}</span>
                            <span>•</span>
                            <span>Min Required: {item.minStockLevel} {item.productUnit || 'pcs'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger-text)', lineHeight: 1 }}>0</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Current Qty</div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => openRequestModal(item)}>
                          <ShoppingCart size={14} /> Request Restock
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* LOW STOCK SECTION */}
        {lowStock.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--warning-border)' }}>
              <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 16 }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingDown size={20} color="var(--warning-text)" />
                    <span style={{ color: 'var(--warning-text)' }}>WARNING: Low Stock</span>
                    <span className="badge badge-warning">{lowStock.length} items</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {lowStock.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                      borderLeft: '3px solid var(--warning-text)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{item.productName}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>SKU: {item.productSku}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning-text)' }}>{item.quantity}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{item.productUnit || 'pcs'} / {item.minStockLevel} min</span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => openRequestModal(item)}>
                          Request
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Request Modal */}
        {modalOpen && selectedProduct && (
            <div className="modal-overlay" onClick={() => setModalOpen(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <div className="modal-title">Request Restock</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {selectedProduct.productName} (Current: {selectedProduct.quantity})
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Requested Quantity</label>
                    <input
                        type="number"
                        className="input"
                        min="1"
                        value={requestQty}
                        onChange={e => setRequestQty(e.target.value)}
                        required
                    />
                    <div className="form-hint">Suggested amount to reach max capacity: {selectedProduct.maxStockLevel - selectedProduct.quantity}</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes for Warehouse / Store Admin</label>
                    <textarea
                        className="input"
                        rows="3"
                        placeholder="e.g. Urgent restock needed for weekend sale..."
                        value={requestNotes}
                        onChange={e => setRequestNotes(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Submit Request</button>
                  </div>
                </form>
              </div>
            </div>
        )}

      </div>
  )
}