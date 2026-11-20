package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubscriptionOrderResponse {
    private String key;       // Razorpay public Key ID — safe for the frontend, never the secret
    private String orderId;
    private Long amount;      // paise
    private String currency;
    private String planName;
    private Double planPrice; // rupees, for display
}