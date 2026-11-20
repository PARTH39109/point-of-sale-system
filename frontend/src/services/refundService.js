import api from './api';

const refundService = {
  processRefund: async (refundData) => {
    return await api.post('/api/refunds', refundData);
  },

  getRefunds: async (params) => {
    return await api.get('/api/refunds', { params });
  },

  getRefundById: async (id) => {
    return await api.get(`/api/refunds/${id}`);
  },

  getRefundsByOrder: async (orderId) => {
    return await api.get(`/api/refunds/order/${orderId}`);
  },

  getRefundByRefundNumber: async (refundNumber) => {
    return await api.get(`/api/refunds/refund-number/${refundNumber}`);
  },

  getRefundsByDateRange: async (start, end, params = {}) => {
    return await api.get('/api/refunds/date-range', {
      params: { start, end, ...params }
    });
  }
};

export default refundService;
