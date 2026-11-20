import api from './api';

const reportingService = {
  getReport: (type, range = 'month') => {
    return api.get(`/api/reports/${type}`, { params: { range } });
  }
};

export default reportingService;
