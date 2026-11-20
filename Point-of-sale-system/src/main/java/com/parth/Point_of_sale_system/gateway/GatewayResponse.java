package com.parth.Point_of_sale_system.gateway;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standardised response object returned by any payment gateway.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayResponse {

    private boolean success;

    /** Gateway's unique transaction / payment ID */
    private String transactionId;

    /** Raw reference provided by gateway (e.g. Razorpay payment_id) */
    private String gatewayReference;

    /** Human-readable message (success message or error reason) */
    private String message;

    /** Error code returned by gateway on failure */
    private String errorCode;
}
