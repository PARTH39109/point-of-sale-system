package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.PaymentMethod;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private Long id;
    private String paymentReference;
    private Long orderId;
    private String orderNumber;
    private Double amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String transactionId;
    private String gatewayName;
    private String gatewayReference;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
