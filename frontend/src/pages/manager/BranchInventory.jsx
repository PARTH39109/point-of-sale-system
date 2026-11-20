import { useEffect, useState } from 'react'
import api from '../../services/api'
import {
  Boxes, Search, Package, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, Edit, Loader2, AlertCircle, CheckCircle, X
} from 'lucide-react'

export default function BranchInventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeTab, setActiveTab] = useState('ALL') // ALL | LOW | OUT
  const [searchTerm, setSearchTerm] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [updateForm, setUpdateForm] = useState({ quantity: 0, type: 'IN', reason: '' })
  const [updating, setUpdating] = useState(false)

  const fetchInventory = async () => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = (activeTab === 'LOW' || activeTab === 'OUT') 
          ? '/api/inventory/me/low-stock' 
          : '/api/inventory/me';
          
      const res = await api.get(endpoint)
      
      let data = res.data;
      if (activeTab === 'LOW') {
        data = data.filter(item => item.quantity <= item.minStockLevel && item.quantity > 0)
      } else if (activeTab === 'OUT') {
        data = data.filter(item => item.quantity === 0)
      }
      
      setInventory(data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [activeTab])

  const filteredInventory = inventory.filter(item => 
    !searchTerm || 
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.productSku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: 'Out of Stock', badge: 'badge-danger' }
    if (item.quantity <= item.minStockLevel) return { label: 'Low Stock', badge: 'badge-warning' }
    if (item.quantity >= item.maxStockLevel * 0.5) return { label: 'Well Stocked', badge: 'badge-success' }
    return { label: 'Normal', badge: 'badge-info' }
  }

  const openUpdateModal = (item) => {
    setSelectedItem(item)
    setUpdateForm({ quantity: 0, type: 'IN', reason: '' })
    setModalOpen(true)
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!selectedItem || updateForm.quantity <= 0) return
    
    setUpdating(true)
    try {
      await api.post('/api/inventory/stock', {
        productId: selectedItem.productId,
        branchId: selectedItem.branchId,
        quantity: parseInt(updateForm.quantity),
        type: updateForm.type,
        reason: updateForm.reason
      })
      setModalOpen(false)
      fetchInventory()
    } catch (err) {
      console.error(err)
      alert('Failed to update stock: ' + (err.response?.data?.message || err.message))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Branch Inventory</div>
            <div className="card-subtitle">Manage stock levels for your branch</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20, paddingBottom: 16 }}>
          {[
            { id: 'ALL', label: 'All Stock' },
            { id: 'LOW', label: 'Low Stock' },
            { id: 'OUT', label: 'Out of Stock' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="table-toolbar" style={{ borderBottom: 'none', padding: '0 0 16px 0' }}>
          <div className="input-with-icon" style={{ maxWidth: 300, flex: 1 }}>
            <Search className="input-icon" />
            <input 
              type="text" 
              className="input" 
              placeholder="Search product or SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="btn btn-secondary btn-icon" onClick={fetchInventory} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper" style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          {loading ? (
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
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock Level</th>
                  <th>Quantity</th>
                  <th>Min/Max</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? filteredInventory.map(item => {
                  const status = getStockStatus(item)
                  const percent = Math.min(100, Math.max(0, (item.quantity / item.maxStockLevel) * 100))
                  const barColor = item.quantity === 0 ? 'var(--danger-text)' : 
                                  item.quantity <= item.minStockLevel ? 'var(--warning-text)' : 
                                  'var(--success-text)'

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.productName}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>{item.productSku}</span></td>
                      <td style={{ minWidth: 150 }}>
                        <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 15 }}>{item.quantity}</td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{item.minStockLevel} / {item.maxStockLevel}</td>
                      <td>
                        <span className={`badge ${status.badge}`}>
                          <span className="badge-dot" />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openUpdateModal(item)}>
                          <Edit size={14} /> Update
                        </button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state" style={{ padding: 40 }}>
                        {activeTab === 'ALL' ? (
                          <Package size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
                        ) : (
                          <CheckCircle size={48} color="var(--success-text)" style={{ marginBottom: 16 }} />
                        )}
                        <h3>{activeTab === 'ALL' ? 'No inventory found' : 'All clear!'}</h3>
                        <p>{activeTab === 'ALL' ? 'Try adjusting your search.' : 'No products in this category.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Update Stock Modal */}
      {modalOpen && selectedItem && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Update Stock</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedItem.productName} • SKU: {selectedItem.productSku}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Quantity</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{selectedItem.quantity}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: getStockStatus(selectedItem).badge.includes('danger') ? 'var(--danger-text)' : 'var(--text-secondary)' }}>
                  {getStockStatus(selectedItem).label}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label required">Movement Type</label>
                <select 
                  className="input" 
                  value={updateForm.type} 
                  onChange={e => setUpdateForm({...updateForm, type: e.target.value})}
                  required
                >
                  <option value="IN">Restock (Add to stock)</option>
                  <option value="OUT">Deduct (Remove from stock)</option>
                  <option value="ADJUSTMENT">Adjustment (Set exact quantity)</option>
                  <option value="RETURN">Return (Add to stock)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label required">Quantity</label>
                <input 
                  type="number" 
                  className="input" 
                  min="1" 
                  value={updateForm.quantity} 
                  onChange={e => setUpdateForm({...updateForm, quantity: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea 
                  className="input" 
                  rows="3"
                  placeholder="Optional notes about this stock movement..."
                  value={updateForm.reason} 
                  onChange={e => setUpdateForm({...updateForm, reason: e.target.value})}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={updating || !updateForm.quantity}>
                  {updating ? <><Loader2 className="spin" size={16} /> Updating...</> : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
