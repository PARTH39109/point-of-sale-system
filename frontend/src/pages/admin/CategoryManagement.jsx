import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, Loader2, AlertCircle, X, Image as ImageIcon, Package, Calendar, AlertTriangle } from 'lucide-react';
import { categoryService } from '../../services/productService';
import { branchService } from '../../services/branchService';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [canFilterByBranch, setCanFilterByBranch] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async (branchId) => {
    try {
      setLoading(true);
      const res = await categoryService.getAllCategories(branchId || undefined);
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const initBranches = async () => {
    try {
      const res = await branchService.getAllBranches();
      if (res.data && res.data.length > 0) {
        setBranches(res.data);
        setCanFilterByBranch(true);
      }
    } catch {
      setCanFilterByBranch(false);
    }
  };

  useEffect(() => {
    initBranches();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCategories(branchFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter]);

  function openAddModal() {
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '', isActive: true });
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive !== false,
    });
    setError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCategory(null);
    setError('');
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      await fetchCategories(branchFilter || undefined);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeleteDialog(category) {
    setDeleteError('');
    setDeleteTarget(category);
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
    setDeleteError('');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await categoryService.deleteCategory(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      fetchCategories(branchFilter || undefined);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  }

  const filtered = useMemo(() =>
          categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
      [categories, searchQuery]
  );

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Categories</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Product categories for your branch</p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Category
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

        <div className="card" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="input-with-icon" style={{ maxWidth: 360, flex: 1 }}>
              <Search className="input-icon" size={16} />
              <input
                  type="text"
                  className="input"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {canFilterByBranch && branches.length > 1 && (
                <select className="input" style={{ maxWidth: 220 }} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            )}
          </div>
        </div>

        {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={32} style={{ animation: 'spin 0.7s linear infinite' }} color="var(--brand-400)" />
            </div>
        ) : filtered.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon"><Tag size={32} /></div>
              <h3 className="empty-state-title">No categories found</h3>
              <p className="empty-state-desc">
                {searchQuery ? `No categories match "${searchQuery}".` : 'Get started by creating your first product category.'}
              </p>
              {!searchQuery && (
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAddModal}>
                    <Plus size={16} /> Add First Category
                  </button>
              )}
            </div>
        ) : (
            <div className="grid-cols-3">
              {filtered.map(category => {
                const initials = category.name?.slice(0, 2).toUpperCase();
                return (
                    <div key={category.id} className="category-card" onClick={() => openEditModal(category)}>
                      <div className="category-card-image-wrap">
                        {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} />
                        ) : (
                            <div className="category-card-noimage">
                              <ImageIcon size={32} />
                              <span style={{ fontSize: 12 }}>No Image</span>
                            </div>
                        )}
                        <div className="category-card-badge-topright">
                    <span className={`badge ${category.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                        </div>
                        {canFilterByBranch && category.branchName && (
                            <div className="category-card-badge-topleft">
                              <span className="badge badge-neutral">{category.branchName}</span>
                            </div>
                        )}
                      </div>

                      <div className="category-card-body">
                        <div className="category-card-name">{category.name}</div>
                        <div className="category-card-desc">{category.description || 'No description provided.'}</div>

                        <div className="category-card-meta">
                          <span><Package size={13} /> {category.productCount ?? 0} products</span>
                          {category.createdAt && (
                              <span><Calendar size={13} /> {new Date(category.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="category-card-actions" onClick={e => e.stopPropagation()}>
                          <button className="btn btn-secondary btn-sm btn-icon" title="Edit" onClick={() => openEditModal(category)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => openDeleteDialog(category)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3 className="modal-title">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                  <button onClick={closeModal} className="btn btn-ghost btn-icon btn-sm"><X size={18} /></button>
                </div>

                {error && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--danger-text)' }}>
                      {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label required">Category Name</label>
                    <input className="input" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Beverages" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="input" name="description" rows={3} value={formData.description} onChange={handleInputChange} placeholder="Brief description of products in this category" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Image URL</label>
                    <input className="input" name="imageUrl" type="url" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
                  </div>

                  {!editingCategory && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        This category will be created for your current branch only.
                      </p>
                  )}

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Category is Active</span>
                    </label>
                  </div>

                  <div className="modal-footer">
                    <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting
                          ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                          : (editingCategory ? 'Update Category' : 'Create Category')}
                    </button>
                  </div>
                </form>
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
                  <AlertTriangle size={26} color="var(--danger-text)" />
                </div>
                <h3 className="modal-title" style={{ marginBottom: 8 }}>Delete Category</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.name}"</strong>?
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>This action cannot be undone.</p>

                {deleteError && (
                    <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginTop: 14, fontSize: 13, color: 'var(--danger-text)', textAlign: 'left' }}>
                      {deleteError}
                    </div>
                )}

                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</button>
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

export default CategoryManagement;