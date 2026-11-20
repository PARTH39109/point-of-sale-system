package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.RefundType;
import lombok.Data;

import java.util.List;

@Data
public class RefundRequest {
    private Long orderId;
    private Long paymentId; // Optional leg reference
    private String refundReason;
    private RefundType refundType; // FULL, PARTIAL, ITEM_WISE
    private String notes;
    private List<RefundItemRequest> items;

    @Data
    public static class RefundItemRequest {
        private Long productId;
        private Integer quantityRefunded;
        private Double unitPrice;
        private Double taxRefunded;
        private Double discountRefunded;
        private Double refundAmount;
    }
}
