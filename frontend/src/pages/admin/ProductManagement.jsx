import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Search, Loader2, AlertCircle, X, Tag, Barcode } from 'lucide-react';
import { productService, categoryService, inventoryService } from '../../services/productService';
import { branchService } from '../../services/branchService';

const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'dozen', 'pack'];

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', categoryId: '', unit: 'pcs',
  price: 0, mrp: 0, sellingPrice: 0, taxRate: 0, brand: '', image: '',
  description: '', isActive: true, branchId: '',
  currentStock: 0, minStockLevel: 10, maxStockLevel: 100,
};

const ProductManagement = () => {
  const user = useSelector(selectUser);
  const isBranchManager = user?.role === 'ROLE_BRANCH_MANAGER';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [stockLoading, setStockLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, branchRes] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
        branchService.getAllBranches(),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      const allBranches = branchRes.data;
      if (user?.role === 'ROLE_BRANCH_MANAGER' && user?.branchId) {
        // Manager sees only their own branch
        setBranches(allBranches.filter(b => b.id === user.branchId));
      } else {
        setBranches(allBranches);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadStockForBranch = async (productId, branchId) => {
    if (!branchId) return;
    try {
      setStockLoading(true);
      const res = await inventoryService.getInventoryByBranch(branchId);
      const match = res.data.find(inv => inv.productId === productId);
      setFormData(prev => ({
        ...prev,
        currentStock: match ? match.quantity : 0,
        minStockLevel: match ? match.minStockLevel : 10,
        maxStockLevel: match ? match.maxStockLevel : 100,
      }));
    } catch {
      // Non-fatal — stock section just falls back to defaults
    } finally {
      setStockLoading(false);
    }
  };

  const handleBranchChange = async (e) => {
    const branchId = e.target.value;
    setFormData(prev => ({ ...prev, branchId }));
    if (editingProduct && branchId) {
      await loadStockForBranch(editingProduct.id, Number(branchId));
    }
  };

  const handleOpenModal = async (product = null) => {
    setError('');
    const defaultBranchId = branches.length > 0 ? branches[0].id : '';

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        unit: product.unit || 'pcs',
        price: product.price || 0,
        mrp: product.mrp || 0,
        sellingPrice: product.sellingPrice || 0,
        taxRate: product.taxRate || 0,
        brand: product.brand || '',
        image: product.image || '',
        description: product.description || '',
        isActive: product.isActive !== false,
        branchId: defaultBranchId,
        currentStock: 0, minStockLevel: 10, maxStockLevel: 100,
      });
      setIsModalOpen(true);
      if (defaultBranchId) await loadStockForBranch(product.id, defaultBranchId);
    } else {
      setEditingProduct(null);
      const managerBranchId = user?.role === 'ROLE_BRANCH_MANAGER' && user?.branchId ? user.branchId : defaultBranchId;
      setFormData({ ...EMPTY_FORM, branchId: managerBranchId });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');

      const { branchId, currentStock, minStockLevel, maxStockLevel, ...productFields } = formData;
      const payload = { ...productFields, categoryId: formData.categoryId ? Number(formData.categoryId) : null };

      let savedProductId = editingProduct?.id;
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
      } else {
        const res = await productService.createProduct(payload);
        savedProductId = res.data.id;
      }

      if (formData.branchId) {
        await inventoryService.updateStock({
          productId: savedProductId,
          branchId: Number(formData.branchId),
          quantity: Number(formData.currentStock) || 0,
          type: 'ADJUSTMENT',
          reason: editingProduct ? 'Stock updated via product edit' : 'Initial stock entry',
          minStockLevel: Number(formData.minStockLevel) || 10,
          maxStockLevel: Number(formData.maxStockLevel) || 100,
        });
      }

      await fetchData();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (product) => {
    setDeleteError('');
    setDeleteTarget(product);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await productService.deleteProduct(deleteTarget.id);
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);

  const filteredProducts = products.filter(product => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.barcode && product.barcode.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === '' || (product.categoryId && product.categoryId.toString() === selectedCategory);
    const matchesStatus = selectedStatus === '' ||
        (selectedStatus === 'ACTIVE' && product.isActive) ||
        (selectedStatus === 'INACTIVE' && !product.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading && products.length === 0) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Loader2 size={32} style={{ animation: 'spin 0.7s linear infinite' }} color="var(--brand-400)" />
        </div>
    );
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Product Management</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage your store inventory catalog</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Product
          </button>
        </div>

        {error && !isModalOpen && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--danger-text)',
            }}>
              <AlertCircle size={16} />{error}
            </div>
        )}

        {/* Toolbar */}
        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="input-with-icon" style={{ maxWidth: 340, flex: 1 }}>
              <Search className="input-icon" size={16} />
              <input
                  type="text"
                  className="input"
                  placeholder="Search by name, SKU or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="input" style={{ maxWidth: 200 }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select className="input" style={{ maxWidth: 160 }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="table-container">
          {filteredProducts.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product</th>
                    <th>SKU / Barcode</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Pricing</th>
                    <th>Tax</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          {product.image ? (
                              <img src={product.image} alt={product.name} className="product-thumb" />
                          ) : (
                              <div className="product-thumb-placeholder">
                                <Package size={18} />
                              </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</div>
                          {product.brand && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{product.brand}</div>}
                        </td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>SKU: {product.sku}</div>
                          {product.barcode && (
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Barcode size={12} /> {product.barcode}
                              </div>
                          )}
                        </td>
                        <td>
                          {product.categoryName ? (
                              <span className="badge badge-info"><Tag size={12} />{product.categoryName}</span>
                          ) : (
                              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>-</span>
                          )}
                        </td>
                        <td><span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{product.unit || 'pcs'}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(product.sellingPrice)}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>MRP: {formatCurrency(product.mrp)}</div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{product.taxRate ? `${product.taxRate}%` : '-'}</td>
                        <td>
                      <span className={`badge ${product.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        <span className="badge-dot" />{product.isActive ? 'Active' : 'Inactive'}
                      </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm btn-icon" title="Edit Product" onClick={() => handleOpenModal(product)}>
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm btn-icon" title="Delete Product" onClick={() => openDeleteDialog(product)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={32} /></div>
                <h3 className="empty-state-title">No products found</h3>
                <p className="empty-state-desc">
                  {searchQuery || selectedCategory || selectedStatus
                      ? 'No products match your current filters.'
                      : 'Get started by adding your first product to the catalog.'}
                </p>
                {(!searchQuery && !selectedCategory && !selectedStatus) && (
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => handleOpenModal()}>
                      <Plus size={16} /> Add First Product
                    </button>
                )}
              </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal modal-lg" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                  <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                  <button onClick={handleCloseModal} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <form id="productForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {error && (
                        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--danger-text)' }}>
                          {error}
                        </div>
                    )}

                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                        Basic Information
                      </h4>
                      <div className="grid-cols-2">
                        <div className="form-group">
                          <label className="form-label required">Product Name</label>
                          <input name="name" required className="input" value={formData.name} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Category</label>
                          <select name="categoryId" className="input" value={formData.categoryId} onChange={handleInputChange}>
                            <option value="">Select a category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label required">Unit</label>
                          <select name="unit" required className="input" value={formData.unit} onChange={handleInputChange}>
                            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label required">SKU</label>
                          <input name="sku" required className="input" value={formData.sku} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Barcode</label>
                          <div className="input-with-icon">
                            <Barcode className="input-icon" size={16} />
                            <input name="barcode" className="input" value={formData.barcode} onChange={handleInputChange} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Brand</label>
                          <input name="brand" className="input" value={formData.brand} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                        Pricing & Tax
                      </h4>
                      <div className="grid-cols-3">
                        <div className="form-group">
                          <label className="form-label">MRP (₹)</label>
                          <input name="mrp" type="number" min="0" step="0.01" className="input" value={formData.mrp} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Purchase Price (₹)</label>
                          <input name="price" type="number" min="0" step="0.01" className="input" value={formData.price} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Selling Price (₹)</label>
                          <input name="sellingPrice" type="number" min="0" step="0.01" className="input" value={formData.sellingPrice} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tax Rate (%)</label>
                          <input name="taxRate" type="number" min="0" max="100" step="0.01" className="input" value={formData.taxRate} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                        Stock & Availability {stockLoading && <Loader2 size={13} style={{ marginLeft: 6, animation: 'spin 0.7s linear infinite', display: 'inline' }} />}
                      </h4>
                      {branches.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                            No branches found yet. Create a branch first to track stock for this product.
                          </p>
                      ) : (
                          <div className="grid-cols-2">
                            <div className="form-group">
                              <label className="form-label required">Branch</label>
                              <select name="branchId" required className="input" value={formData.branchId} onChange={handleBranchChange}>
                                <option value="">Select a branch</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                              {editingProduct && (
                                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Switch branches to view/edit that branch's stock.</p>
                              )}
                            </div>
                            <div className="form-group">
                              <label className="form-label">Current Stock Quantity ({formData.unit})</label>
                              <input name="currentStock" type="number" min="0" className="input" value={formData.currentStock} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Low Stock Alert (Min)</label>
                              <input name="minStockLevel" type="number" min="0" className="input" value={formData.minStockLevel} onChange={handleInputChange} />
                              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Alert triggers at or below this quantity.</p>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Max Stock Level</label>
                              <input name="maxStockLevel" type="number" min="0" className="input" value={formData.maxStockLevel} onChange={handleInputChange} />
                            </div>
                          </div>
                      )}
                    </div>

                    <div>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                        Additional Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Image URL</label>
                          <input name="image" type="url" className="input" value={formData.image} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea name="description" rows={3} className="input" value={formData.description} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                            <span style={{ fontSize: 14, fontWeight: 500 }}>Product is Active</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</button>
                  <button type="submit" form="productForm" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting
                        ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                        : (editingProduct ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteTarget && (
            <div className="modal-overlay">
              <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <AlertCircle size={26} color="var(--danger-text)" />
                </div>
                <h3 className="modal-title" style={{ marginBottom: 8 }}>Delete Product</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.name}"</strong>?
                </p>
                {deleteError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: 14, fontSize: 13, color: 'var(--danger-text)', textAlign: 'left' }}>
                      {deleteError}
                    </div>
                )}
                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</button>
                  <button className="btn btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                    {isDeleting ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default ProductManagement;