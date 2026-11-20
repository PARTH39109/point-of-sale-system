import api from './api';

const biService = {
  getDashboardAnalytics: (range = 'month') => {
    return api.get('/api/bi/dashboard', { params: { range } });
  }
};

export default biService;
