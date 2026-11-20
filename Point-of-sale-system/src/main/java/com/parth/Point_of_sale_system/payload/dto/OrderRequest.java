package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.PaymentStatus;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    private Long branchId;
    private Long customerId;
    private List<OrderItemRequest> items;
    
    private Double subtotal;
    private Double discountAmount;
    private String discountType;
    private Double taxAmount;
    private Double grandTotal;
    
    private PaymentStatus paymentStatus;
    private String paymentMethod;
    private String notes;
    
    @Data
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        private Double unitPrice;
        private Double discount;
        private Double tax;
    }
}
