import api from './api'

export const subscriptionPaymentService = {
    createOrder: (subscriptionPlanId) => api.post('/api/subscription-payment/create-order', { subscriptionPlanId }),
    verifyPayment: (data) => api.post('/api/subscription-payment/verify', data),
    getHistory: () => api.get('/api/subscription-payment/history'),
    getInvoice: (invoiceNumber) => api.get(`/api/subscription-payment/invoice/${invoiceNumber}`),
    downloadInvoicePdf: (invoiceNumber) => api.get(`/api/subscription-payment/invoice/${invoiceNumber}/pdf`, { responseType: 'blob' }),
}