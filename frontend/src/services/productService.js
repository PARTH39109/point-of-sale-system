import api from './api'

export const categoryService = {
  getAllCategories: (branchId) => api.get('/api/category', { params: branchId ? { branchId } : {} }),
  getCategoryById:  (id)       => api.get(`/api/category/${id}`),
  createCategory:   (data)     => api.post('/api/category', data),
  updateCategory:   (id, data) => api.put(`/api/category/${id}`, data),
  deleteCategory:   (id)       => api.delete(`/api/category/${id}`),
}

export const productService = {
  getAllProducts: ()        => api.get('/api/product'),
  searchProducts: (query)   => api.get('/api/product/search', { params: { query } }),
  createProduct:  (data)    => api.post('/api/product', data),
  updateProduct:  (id, data) => api.put(`/api/product/${id}`, data),
  deleteProduct:  (id)      => api.delete(`/api/product/${id}`),
}

export const inventoryService = {
  getInventoryByBranch: (branchId) => api.get(`/api/inventory/branch/${branchId}`),
  getLowStockAlerts:    (branchId) => api.get(`/api/inventory/branch/${branchId}/low-stock`),
  getStockMovements:    (branchId) => api.get(`/api/inventory/branch/${branchId}/movements`),
  updateStock:          (data)     => api.post('/api/inventory/stock', data),
}