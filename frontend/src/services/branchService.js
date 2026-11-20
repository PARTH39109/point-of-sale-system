import api from './api'

export const branchService = {
  getAllBranches: ()        => api.get('/api/branch'),
  getBranchById:  (id)      => api.get(`/api/branch/${id}`),
  createBranch:   (data)    => api.post('/api/branch', data),
  updateBranch:   (id, data) => api.put(`/api/branch/${id}`, data),
  deleteBranch:   (id)      => api.delete(`/api/branch/${id}`),
}

export const employeeService = {
  getAllEmployees:  ()          => api.get('/api/employee'),
  getManagers:      ()          => api.get('/api/employee/managers'),
  getEmployeeById:  (id)        => api.get(`/api/employee/${id}`),
  createEmployee:   (data)      => api.post('/api/employee', data),
  updateEmployee:   (id, data)  => api.put(`/api/employee/${id}`, data),
  deleteEmployee:   (id)        => api.delete(`/api/employee/${id}`),
  updateManager:    (id, data)  => api.put(`/api/employee/managers/${id}`, data),
  deleteManager:    (id)        => api.delete(`/api/employee/managers/${id}`),
}

export const cashierService = {
  getAllCashiers:   ()          => api.get('/api/cashier'),
  getCashierById:   (id)        => api.get(`/api/cashier/${id}`),
  createCashier:    (data)      => api.post('/api/cashier', data),
  updateCashier:    (id, data)  => api.put(`/api/cashier/${id}`, data),
  deleteCashier:    (id)        => api.delete(`/api/cashier/${id}`),
}