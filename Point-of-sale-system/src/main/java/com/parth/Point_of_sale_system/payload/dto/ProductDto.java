package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private String sku;
    private String barcode;
    private String description;
    private Double price;
    private Double mrp;
    private Double sellingPrice;
    private String brand;
    private String image;
    private String unit;
    private Long categoryId;
    private String categoryName;
    private Long storeId;
    private Long branchId;
    private String branchName;
    private Double taxRate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}