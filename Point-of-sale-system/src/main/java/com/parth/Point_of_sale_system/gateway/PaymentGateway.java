package com.parth.Point_of_sale_system.gateway;

/**
 * Contract that every payment gateway adapter must implement.
 * New gateways can be plugged in without changing business logic.
 */
public interface PaymentGateway {

    /**
     * Initiates a payment with the gateway.
     * @param amount   Amount to charge
     * @param currency ISO currency code e.g. "INR"
     * @param metadata Arbitrary context (order number, customer id, etc.)
     * @return GatewayResponse with transactionId and status
     */
    GatewayResponse initiatePayment(Double amount, String currency, String metadata);

    /**
     * Verifies that a previously initiated payment succeeded.
     * @param transactionId The gateway's transaction / payment ID
     * @return true if the payment is confirmed successful
     */
    boolean verifyPayment(String transactionId);

    /**
     * Initiates a refund for a previously captured payment.
     * @param transactionId The gateway's original transaction ID
     * @param amount        Amount to refund (can be partial)
     * @return GatewayResponse with refund reference
     */
    GatewayResponse initiateRefund(String transactionId, Double amount);

    /** Human-readable gateway name stored in the Payment record */
    String getGatewayName();

    default GatewayResponse createCheckoutOrder(Double amount, String currency, String receipt) {
        throw new UnsupportedOperationException(getGatewayName() + " does not support redirect-based checkout orders");
    }

    default boolean verifyCheckoutSignature(String orderId, String paymentId, String signature) {
        throw new UnsupportedOperationException(getGatewayName() + " does not support checkout signature verification");
    }

}
