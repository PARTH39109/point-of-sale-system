package com.parth.Point_of_sale_system.gateway.impl;

import com.parth.Point_of_sale_system.gateway.GatewayResponse;
import com.parth.Point_of_sale_system.gateway.PaymentGateway;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class RazorpayGateway implements PaymentGateway {

    @Value("${razorpay.key.id:RAZORPAY_KEY_ID_PLACEHOLDER}")
    private String keyId;

    @Value("${razorpay.key.secret:RAZORPAY_KEY_SECRET_PLACEHOLDER}")
    private String keySecret;

    private RazorpayClient client;

    @PostConstruct
    private void init() {
        try {
            this.client = new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            log.warn("RazorpayClient could not be initialised — checkout-order features will fail until razorpay.key.id/secret are set: {}", e.getMessage());
        }
    }

    // ---- Existing in-store terminal payment simulation (card/UPI at POS) — UNCHANGED ----
    // Card-present / UPI-collect capture is a different integration model from redirect-based
    // Checkout below, and is outside the scope of subscription payments. Do not repurpose this.

    @Override
    public GatewayResponse initiatePayment(Double amount, String currency, String metadata) {
        log.info("[RazorpayGateway STUB] initiatePayment amount={} currency={}", amount, currency);
        return GatewayResponse.builder()
                .success(true)
                .transactionId("rzp_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .gatewayReference("rzp_order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8))
                .message("Razorpay payment initiated (simulation)")
                .build();
    }

    @Override
    public boolean verifyPayment(String transactionId) {
        log.info("[RazorpayGateway STUB] verifyPayment transactionId={}", transactionId);
        return transactionId != null && transactionId.startsWith("rzp_");
    }

    @Override
    public GatewayResponse initiateRefund(String transactionId, Double amount) {
        log.info("[RazorpayGateway STUB] initiateRefund transactionId={} amount={}", transactionId, amount);
        return GatewayResponse.builder()
                .success(true)
                .transactionId("rzp_rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .message("Razorpay refund initiated (simulation)")
                .build();
    }

    @Override
    public String getGatewayName() {
        return "RAZORPAY";
    }

    // ---- Real Razorpay Test Mode integration — used by subscription checkout ----

    @Override
    public GatewayResponse createCheckoutOrder(Double amount, String currency, String receipt) {
        if (client == null) {
            return GatewayResponse.builder()
                    .success(false)
                    .message("Razorpay is not configured. Set razorpay.key.id / razorpay.key.secret.")
                    .errorCode("GATEWAY_NOT_CONFIGURED")
                    .build();
        }
        try {
            long amountInSmallestUnit = Math.round(amount * 100);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInSmallestUnit);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receipt);
            orderRequest.put("payment_capture", 1);

            com.razorpay.Order order = client.orders.create(orderRequest);

            return GatewayResponse.builder()
                    .success(true)
                    .transactionId(order.get("id"))
                    .gatewayReference(order.get("id"))
                    .message("Razorpay order created")
                    .build();
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed", e);
            return GatewayResponse.builder()
                    .success(false)
                    .message("Failed to create Razorpay order: " + e.getMessage())
                    .errorCode("ORDER_CREATE_FAILED")
                    .build();
        }
    }

    @Override
    public boolean verifyCheckoutSignature(String orderId, String paymentId, String signature) {
        if (client == null) return false;
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, keySecret);
        } catch (RazorpayException e) {
            log.error("Razorpay signature verification failed", e);
            return false;
        }
    }

    /** Best-effort lookup of the actual method used (card/upi/netbanking/wallet) — not part of the shared interface. */
    public String fetchPaymentMethod(String paymentId) {
        if (client == null) return "ONLINE";
        try {
            com.razorpay.Payment payment = client.payments.fetch(paymentId);
            Object method = payment.get("method");
            return method != null ? method.toString() : "ONLINE";
        } catch (Exception e) {
            return "ONLINE";
        }
    }
}