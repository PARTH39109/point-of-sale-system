package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantityRefunded;
    private Double unitPrice;
    private Double taxRefunded;
    private Double discountRefunded;
    private Double refundAmount;
}
