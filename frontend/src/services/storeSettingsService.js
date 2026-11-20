import api from './api';

const storeSettingsService = {
  getSettings: () => api.get('/api/store/settings'),
  updateSettings: (data) => api.put('/api/store/settings', data),
  getAboutStore: () => api.get('/api/store/settings/about'),
  getAuditLogs: () => api.get('/api/store/settings/audit-logs'),
  changePassword: (data) => api.post('/api/store/settings/change-password', data),
};

export default storeSettingsService;
