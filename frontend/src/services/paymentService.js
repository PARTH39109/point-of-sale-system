import api from './api';

const paymentService = {
    /**
     * Process a single or split payment.
     * @param {Object} paymentData - { orderId, amount, paymentMethod, remarks }
     *                               OR { orderId, splitLegs: [{amount, paymentMethod, remarks}] }
     */
    processPayment: async (paymentData) => {
        return await api.post('/api/payments', paymentData);
    },

    getPaymentById: async (id) => {
        return await api.get(`/api/payments/${id}`);
    },

    getPaymentsByOrder: async (orderId) => {
        return await api.get(`/api/payments/order/${orderId}`);
    },

    getPaymentByReference: async (paymentReference) => {
        return await api.get(`/api/payments/reference/${paymentReference}`);
    },

    getPaymentsByDateRange: async (start, end, params = {}) => {
        return await api.get('/api/payments/date-range', {
            params: { start, end, ...params }
        });
    }
};

export default paymentService;