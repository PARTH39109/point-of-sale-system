package com.parth.Point_of_sale_system.payload.dto;

import lombok.Data;

@Data
public class VerifySubscriptionPaymentRequest {
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}