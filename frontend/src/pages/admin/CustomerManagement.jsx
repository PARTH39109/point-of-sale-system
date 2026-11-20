import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, Loader2, AlertCircle, X, Mail, Phone, MapPin, Award } from 'lucide-react';
import api from '../../services/api'; // I'll assume we'll just use api directly since there's no customerService yet

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    loyaltyPoints: 0
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/customer');
      setCustomers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
        loyaltyPoints: customer.loyaltyPoints || 0
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        loyaltyPoints: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      
      if (editingCustomer) {
        await api.put(`/api/customer/${editingCustomer.id}`, formData);
      } else {
        await api.post('/api/customer', formData);
      }
      
      await fetchCustomers();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/api/customer/${id}`);
      await fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer');
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const term = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.toLowerCase().includes(term))
    );
  });

  if (loading && customers.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Customer Directory</h1>
          <p className="text-text-secondary mt-1">Manage your store's customers and loyalty program</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="bg-danger-bg/20 text-danger-text p-4 rounded-md flex items-center border border-danger-bg">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="card p-6 flex flex-col hover:border-brand-400/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="avatar bg-brand-400/20 text-brand-400 flex items-center justify-center font-bold text-lg rounded-full w-12 h-12 shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-text-primary">{customer.name}</h3>
                    {customer.loyaltyPoints > 0 && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-info-bg/10 text-info-text border border-info-bg/20">
                        <Award className="w-3 h-3" />
                        {customer.loyaltyPoints} Points
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1 mb-6">
                {customer.email && (
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3 text-sm text-text-secondary">
                    <MapPin className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
              </div>
              
              <div className="divider my-4"></div>
              
              <div className="flex justify-end gap-2 mt-auto">
                <button 
                  className="btn btn-ghost btn-sm text-text-secondary hover:text-brand-400"
                  onClick={() => handleOpenModal(customer)}
                  title="Edit Customer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  className="btn btn-ghost btn-sm text-danger-text hover:bg-danger-bg/10"
                  onClick={() => handleDelete(customer.id)}
                  title="Delete Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No customers found</h3>
          <p className="text-text-secondary max-w-sm mb-6">
            {searchQuery 
              ? `No customers match your search "${searchQuery}".` 
              : "Get started by adding your first customer to the directory."}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Customer
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal max-w-md w-full">
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="text-text-tertiary hover:text-text-primary transition-colors" onClick={handleCloseModal}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="bg-danger-bg/20 text-danger-text p-3 rounded text-sm flex items-start border border-danger-bg">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="loyaltyPoints">Loyalty Points</label>
                  <input
                    id="loyaltyPoints"
                    name="loyaltyPoints"
                    type="number"
                    min="0"
                    className="input"
                    value={formData.loyaltyPoints}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="input min-h-[80px] resize-y"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Special preferences, complaints, etc."
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary min-w-[120px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    editingCustomer ? 'Update Customer' : 'Add Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
