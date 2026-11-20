package com.parth.Point_of_sale_system.mapper;

import com.parth.Point_of_sale_system.modal.Payment;
import com.parth.Point_of_sale_system.payload.dto.PaymentDto;

public class PaymentMapper {

    public static PaymentDto toDto(Payment payment) {
        if (payment == null) return null;
        return PaymentDto.builder()
                .id(payment.getId())
                .paymentReference(payment.getPaymentReference())
                .orderId(payment.getOrder().getId())
                .orderNumber(payment.getOrder().getOrderNumber())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .transactionId(payment.getTransactionId())
                .gatewayName(payment.getGatewayName())
                .gatewayReference(payment.getGatewayReference())
                .remarks(payment.getRemarks())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
