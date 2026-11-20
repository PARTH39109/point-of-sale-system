import api from './api';

const invoiceService = {
  getInvoiceByInvoiceNumber: async (invoiceNumber) => {
    return await api.get(`/api/invoices/${invoiceNumber}`);
  },

  getInvoiceByOrderId: async (orderId) => {
    return await api.get(`/api/invoices/order/${orderId}`);
  },

  downloadInvoicePdf: async (invoiceNumber) => {
    const response = await api.get(`/api/invoices/download/${invoiceNumber}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default invoiceService;
