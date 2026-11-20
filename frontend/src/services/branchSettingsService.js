import api from './api';

const branchSettingsService = {
  getSettings: () => api.get('/api/branch/settings'),
  updateSettings: (data) => api.put('/api/branch/settings', data),
  syncNow: () => api.post('/api/branch/settings/sync'),
  updateProfile: (data) => api.put('/api/branch/settings/profile', data),
};

export default branchSettingsService;
