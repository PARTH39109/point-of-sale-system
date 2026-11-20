package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Inventory;
import com.parth.Point_of_sale_system.modal.Product;
import com.parth.Point_of_sale_system.payload.dto.InventoryDto;

public class InventoryMapper {

    public static InventoryDto toDto(Inventory inventory) {
        if (inventory == null) {
            return null;
        }

        Product product = inventory.getProduct();
        Branch branch = inventory.getBranch();

        return InventoryDto.builder()
                .id(inventory.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : null)
                .productSku(product != null ? product.getSku() : null)
                .productBarcode(product != null ? product.getBarcode() : null)
                .productUnit(product != null ? product.getUnit() : null)
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .quantity(inventory.getQuantity())
                .minStockLevel(inventory.getMinStockLevel())
                .maxStockLevel(inventory.getMaxStockLevel())
                .lastRestockedAt(inventory.getLastRestockedAt())
                .createdAt(inventory.getCreatedAt())
                .updatedAt(inventory.getUpdatedAt())
                .build();
    }

    public static Inventory toEntity(InventoryDto dto, Product product, Branch branch) {
        if (dto == null) {
            return null;
        }

        return Inventory.builder()
                .id(dto.getId())
                .product(product)
                .branch(branch)
                .quantity(dto.getQuantity())
                .minStockLevel(dto.getMinStockLevel())
                .maxStockLevel(dto.getMaxStockLevel())
                .lastRestockedAt(dto.getLastRestockedAt())
                .build();
    }
}