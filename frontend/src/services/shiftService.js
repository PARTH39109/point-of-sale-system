import api from './api'

export const shiftService = {
    startShift: (data) => api.post('/api/shift/start', data),
    endShift: (id, data) => api.put(`/api/shift/${id}/end`, data),
    getActiveShift: () => api.get('/api/shift/active'),
    getShifts: (params) => api.get('/api/shift', { params }),
    getKpis: (params) => api.get('/api/shift/kpis', { params }),
    getShiftReport: (id) => api.get(`/api/shift/${id}/report`),
}