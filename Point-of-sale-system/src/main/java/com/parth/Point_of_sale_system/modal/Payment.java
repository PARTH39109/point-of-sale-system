package com.parth.Point_of_sale_system.modal;

import com.parth.Point_of_sale_system.domain.PaymentMethod;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a single payment transaction for an order.
 * One order can have MULTIPLE Payment records (split payments).
 * e.g. ₹500 Cash + ₹700 UPI = Order total ₹1200.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    /** Business-facing unique reference e.g. PAY-20260706-000001 */
    @Column(nullable = false, unique = true)
    private String paymentReference;

    /** The order this payment belongs to */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** Amount tendered in this single payment leg */
    @Column(nullable = false)
    private Double amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    /** Transaction ID returned by a payment gateway (Razorpay / Stripe) */
    private String transactionId;

    /** Name of the gateway used e.g. "RAZORPAY", "STRIPE", "INTERNAL" */
    private String gatewayName;

    /** Raw reference / response ID from gateway */
    private String gatewayReference;

    private String remarks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (paymentStatus == null) paymentStatus = PaymentStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
