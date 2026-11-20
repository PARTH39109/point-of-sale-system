package com.parth.Point_of_sale_system.mapper;

import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.SubscriptionPayment;
import com.parth.Point_of_sale_system.modal.SubscriptionPlan;
import com.parth.Point_of_sale_system.payload.dto.SubscriptionInvoiceDto;
import com.parth.Point_of_sale_system.payload.dto.SubscriptionPaymentHistoryDto;

public class SubscriptionPaymentMapper {

    public static SubscriptionPaymentHistoryDto toHistoryDto(SubscriptionPayment p) {
        return SubscriptionPaymentHistoryDto.builder()
                .id(p.getId())
                .invoiceNumber(p.getInvoiceNumber())
                .planName(p.getSubscriptionPlan().getName())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .status(p.getPaymentStatus().name())
                .paymentMethod(p.getPaymentMethod())
                .gatewayName(p.getGatewayName())
                .transactionReference(p.getTransactionReference())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .razorpayOrderId(p.getRazorpayOrderId())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .build();
    }

    public static SubscriptionInvoiceDto toInvoiceDto(SubscriptionPayment p) {
        Store store = p.getStore();
        SubscriptionPlan plan = p.getSubscriptionPlan();
        int months = plan.getDurationMonths() != null ? plan.getDurationMonths() : 12;

        return SubscriptionInvoiceDto.builder()
                .invoiceNumber(p.getInvoiceNumber())
                .storeName(store.getBrand())
                .storeOwnerName(store.getStoreAdmin() != null ? store.getStoreAdmin().getFullName() : null)
                .storeOwnerEmail(store.getStoreAdmin() != null ? store.getStoreAdmin().getEmail() : null)
                .planName(plan.getName())
                .billingPeriodStart(p.getPaidAt())
                .billingPeriodEnd(p.getPaidAt() != null ? p.getPaidAt().plusMonths(months) : null)
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .paymentMethod(p.getPaymentMethod())
                .transactionReference(p.getTransactionReference())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .paidAt(p.getPaidAt())
                .status(p.getPaymentStatus().name())
                .build();
    }
}