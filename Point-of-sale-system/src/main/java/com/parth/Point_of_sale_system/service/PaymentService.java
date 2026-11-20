package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.PaymentDto;
import com.parth.Point_of_sale_system.payload.dto.PaymentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentService {

    /** Process a single or split payment for an order */
    List<PaymentDto> processPayment(PaymentRequest request, User cashier) throws Exception;

    PaymentDto getPaymentById(Long id) throws Exception;

    List<PaymentDto> getPaymentsByOrderId(Long orderId) throws Exception;

    PaymentDto getPaymentByReference(String paymentReference) throws Exception;

    Page<PaymentDto> getPaymentsByDateRange(Long storeId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
