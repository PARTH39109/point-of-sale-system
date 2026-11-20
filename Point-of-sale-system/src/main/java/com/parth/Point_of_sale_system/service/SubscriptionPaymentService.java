package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.*;

import java.util.List;

public interface SubscriptionPaymentService {
    CreateSubscriptionOrderResponse createOrder(CreateSubscriptionOrderRequest request, User user) throws Exception;
    VerifySubscriptionPaymentResponse verifyPayment(VerifySubscriptionPaymentRequest request, User user) throws Exception;
    List<SubscriptionPaymentHistoryDto> getHistory(User user) throws Exception;
    SubscriptionInvoiceDto getInvoice(String invoiceNumber, User user) throws Exception;
    byte[] generateInvoicePdf(String invoiceNumber, User user) throws Exception;
}