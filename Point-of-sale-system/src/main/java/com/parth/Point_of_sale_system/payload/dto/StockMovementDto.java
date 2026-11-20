package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.StockMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovementDto {
    private Long id;
    private Long inventoryId;
    private Long productId;
    private String productName;
    private String productSku;
    private StockMovementType type;
    private Integer quantity;
    private String reason;
    private String performedByName;
    private LocalDateTime createdAt;
}
