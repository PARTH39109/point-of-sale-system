package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String productBarcode;
    private String productUnit;
    private Long branchId;
    private String branchName;
    private Integer quantity;
    private Integer minStockLevel;
    private Integer maxStockLevel;
    private LocalDateTime lastRestockedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}