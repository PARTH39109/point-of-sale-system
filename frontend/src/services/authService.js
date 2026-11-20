import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),

  getRegistrationStores:          ()          => api.get('/auth/stores'),
  getRegistrationBranches:        (storeId)   => api.get(`/auth/stores/${storeId}/branches`),
  requestAccess:                  (data)      => api.post('/auth/access-request', data),
}

export const userService = {
  getProfile:    ()       => api.get('/api/users/profile'),
  getUserById:   (id)     => api.get(`/api/users/${id}`),
}

export const accessRequestService = {
  getRequests:    (status)      => api.get('/api/access-requests', { params: status ? { status } : {} }),
  approveRequest: (id)          => api.put(`/api/access-requests/${id}/approve`),
  rejectRequest:  (id, reason)  => api.put(`/api/access-requests/${id}/reject`, { rejectionReason: reason }),
}

export const storeService = {
  createStore:   (data)         => api.post('/api/store', data),
  getMyStore:    ()             => api.get('/api/store/admin'),
  getStoreById:  (id)           => api.get(`/api/store/${id}`),
  updateStore:   (id, data)     => api.put(`/api/store/${id}`, data),
}