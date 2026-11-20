package com.parth.Point_of_sale_system.domain;

public enum PaymentStatus {
    PENDING,
    PROCESSING,
    PAID,
    SUCCESS,  // gateway-level success (maps to PAID at order level)
    FAILED,
    CANCELLED,
    PARTIALLY_REFUNDED,
    REFUNDED
}
