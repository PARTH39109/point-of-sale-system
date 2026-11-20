package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.Inventory;
import com.parth.Point_of_sale_system.modal.Product;
import com.parth.Point_of_sale_system.modal.StockMovement;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.StockMovementDto;

public class StockMovementMapper {

    public static StockMovementDto toDto(StockMovement movement) {
        if (movement == null) {
            return null;
        }

        Inventory inventory = movement.getInventory();
        Product product = inventory != null ? inventory.getProduct() : null;
        User user = movement.getPerformedBy();

        return StockMovementDto.builder()
                .id(movement.getId())
                .inventoryId(inventory != null ? inventory.getId() : null)
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .productSku(product != null ? product.getSku() : null)
                .type(movement.getType())
                .quantity(movement.getQuantity())
                .reason(movement.getReason())
                .performedByName(user != null ? user.getFullName() : "System")
                .createdAt(movement.getCreatedAt())
                .build();
    }
}
