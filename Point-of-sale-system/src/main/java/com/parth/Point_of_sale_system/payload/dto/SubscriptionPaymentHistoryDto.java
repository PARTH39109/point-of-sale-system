package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPaymentHistoryDto {
    private Long id;
    private String invoiceNumber;
    private String planName;
    private Double amount;
    private String currency;
    private String status;
    private String paymentMethod;
    private String gatewayName;
    private String transactionReference;
    private String razorpayPaymentId;
    private String razorpayOrderId;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}