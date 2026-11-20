import api from './api';

export const orderService = {
    createOrder: async (orderData) => {
        return await api.post('/api/orders', orderData);
    },

    getOrders: async (params) => {
        return await api.get('/api/orders', { params });
    },

    getOrderById: async (id) => {
        return await api.get(`/api/orders/${id}`);
    },

    getOrderByOrderNumber: async (orderNumber) => {
        return await api.get(`/api/orders/order-number/${orderNumber}`);
    },

    updateOrderStatus: async (id, status) => {
        return await api.put(`/api/orders/${id}/status`, null, { params: { status } });
    },

    getOrdersByCustomer: async (customerId, params) => {
        return await api.get(`/api/orders/customer/${customerId}`, { params });
    },

    getOrdersByBranch: async (branchId, params) => {
        return await api.get(`/api/orders/branch/${branchId}`, { params });
    },

    getOrdersByDateRange: async (start, end, params) => {
        return await api.get('/api/orders/date-range', { 
            params: { start, end, ...params } 
        });
    }
};

export default orderService;
