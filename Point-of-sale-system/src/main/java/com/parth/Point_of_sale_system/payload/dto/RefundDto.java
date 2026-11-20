package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.RefundStatus;
import com.parth.Point_of_sale_system.domain.RefundType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundDto {
    private Long id;
    private String refundNumber;
    private Long orderId;
    private String orderNumber;
    private String invoiceNumber;
    private Long paymentId;
    private Long refundedById;
    private String refundedByName;
    private String refundReason;
    private RefundType refundType;
    private RefundStatus refundStatus;
    private Double refundAmount;
    private String notes;
    private List<RefundItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
