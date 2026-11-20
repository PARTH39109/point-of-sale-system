package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.PaymentMethod;
import lombok.Data;

import java.util.List;

/**
 * Request to process one or more payment legs for an order.
 * Supports both single and split payments.
 */
@Data
public class PaymentRequest {

    private Long orderId;

    /** For single-method payments: populated directly */
    private Double amount;
    private PaymentMethod paymentMethod;
    private String remarks;

    /** For split payments: populated instead of amount/paymentMethod */
    private List<PaymentLeg> splitLegs;

    @Data
    public static class PaymentLeg {
        private Double amount;
        private PaymentMethod paymentMethod;
        private String remarks;
    }
}
