package com.parth.Point_of_sale_system.gateway.impl;

import com.parth.Point_of_sale_system.gateway.GatewayResponse;
import com.parth.Point_of_sale_system.gateway.PaymentGateway;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Stripe gateway stub.
 * Replace method bodies with real Stripe SDK calls once live keys are available.
 *
 * Keys are injected from application.properties / environment variables.
 * NEVER hardcode credentials in source code.
 */
@Slf4j
@Component
public class StripeGateway implements PaymentGateway {

    // Keys come from application.properties:
    //   stripe.secret.key=YOUR_STRIPE_SECRET_KEY
    //   stripe.publishable.key=YOUR_STRIPE_PUBLISHABLE_KEY
    @Value("${stripe.secret.key:STRIPE_SECRET_KEY_PLACEHOLDER}")
    private String secretKey;

    @Value("${stripe.publishable.key:STRIPE_PUBLISHABLE_KEY_PLACEHOLDER}")
    private String publishableKey;

    @Override
    public GatewayResponse initiatePayment(Double amount, String currency, String metadata) {
        log.info("[StripeGateway STUB] initiatePayment amount={} currency={}", amount, currency);
        // TODO: Replace with Stripe SDK: Stripe.apiKey = secretKey; PaymentIntent.create(params)
        return GatewayResponse.builder()
                .success(true)
                .transactionId("pi_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .gatewayReference("pi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24))
                .message("Stripe payment initiated (simulation)")
                .build();
    }

    @Override
    public boolean verifyPayment(String transactionId) {
        log.info("[StripeGateway STUB] verifyPayment transactionId={}", transactionId);
        // TODO: Retrieve PaymentIntent from Stripe and verify status == "succeeded"
        return transactionId != null && transactionId.startsWith("pi_");
    }

    @Override
    public GatewayResponse initiateRefund(String transactionId, Double amount) {
        log.info("[StripeGateway STUB] initiateRefund transactionId={} amount={}", transactionId, amount);
        // TODO: Call Stripe Refund.create(params) with charge or payment_intent
        return GatewayResponse.builder()
                .success(true)
                .transactionId("re_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .message("Stripe refund initiated (simulation)")
                .build();
    }

    @Override
    public String getGatewayName() {
        return "STRIPE";
    }
}
