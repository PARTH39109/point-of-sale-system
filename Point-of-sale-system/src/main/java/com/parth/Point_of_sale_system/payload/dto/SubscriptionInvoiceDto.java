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
public class SubscriptionInvoiceDto {
    private String invoiceNumber;
    private String storeName;
    private String storeOwnerName;
    private String storeOwnerEmail;
    private String planName;
    private LocalDateTime billingPeriodStart;
    private LocalDateTime billingPeriodEnd;
    private Double amount;
    private String currency;
    private String paymentMethod;
    private String transactionReference;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;
    private String status;
}