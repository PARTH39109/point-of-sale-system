package com.parth.Point_of_sale_system.payload.request;

import com.parth.Point_of_sale_system.domain.StockMovementType;
import lombok.Data;

@Data
public class UpdateStockRequest {
    private Long productId;
    private Long branchId;
    private Integer quantity;
    private StockMovementType type;
    private String reason;

    // Optional — when provided, updates the low/high stock alert thresholds
    // for this product+branch alongside the quantity change.
    private Integer minStockLevel;
    private Integer maxStockLevel;
}