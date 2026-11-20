package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.OrderStatus;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
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
public class OrderDto {
    private Long id;
    private String orderNumber;
    private String invoiceNumber;
    private Long storeId;
    private Long branchId;
    private Long cashierId;
    private String cashierName;
    private Long customerId;
    private String customerName;
    
    private List<OrderItemDto> items;
    
    private Double subtotal;
    private Double discountAmount;
    private String discountType;
    private Double taxAmount;
    private Double grandTotal;
    
    private Integer totalItems;
    private Integer totalQuantity;
    
    private PaymentStatus paymentStatus;
    private OrderStatus orderStatus;
    private String paymentMethod;
    private String notes;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
