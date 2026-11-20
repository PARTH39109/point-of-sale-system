package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;

public interface InvoiceService {
    OrderDto getInvoiceByInvoiceNumber(String invoiceNumber, User user) throws Exception;
    OrderDto getInvoiceByOrderId(Long orderId, User user) throws Exception;
    byte[] generateInvoicePdf(String invoiceNumber, User user) throws Exception;
}
