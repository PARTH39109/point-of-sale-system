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
public class VerifySubscriptionPaymentResponse {
    private boolean success;
    private String message;
    private String invoiceNumber;
    private String planName;
    private LocalDateTime validUntil;
}