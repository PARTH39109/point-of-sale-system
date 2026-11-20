package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Category;
import com.parth.Point_of_sale_system.modal.Product;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.payload.dto.ProductDto;

public class ProductMapper {

    public static ProductDto toDto(Product product) {
        if (product == null) {
            return null;
        }

        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .description(product.getDescription())
                .price(product.getPrice())
                .mrp(product.getMrp())
                .sellingPrice(product.getSellingPrice())
                .brand(product.getBrand())
                .image(product.getImage())
                .unit(product.getUnit())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .storeId(product.getStore() != null ? product.getStore().getId() : null)
                .branchId(product.getBranch() != null ? product.getBranch().getId() : null)
                .branchName(product.getBranch() != null ? product.getBranch().getName() : null)
                .taxRate(product.getTaxRate())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public static Product toEntity(ProductDto dto, Category category, Store store) {
        return toEntity(dto, category, store, null);
    }

    public static Product toEntity(ProductDto dto, Category category, Store store, Branch branch) {
        if (dto == null) {
            return null;
        }

        return Product.builder()
                .id(dto.getId())
                .name(dto.getName())
                .sku(dto.getSku())
                .barcode(dto.getBarcode())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .mrp(dto.getMrp())
                .sellingPrice(dto.getSellingPrice())
                .brand(dto.getBrand())
                .image(dto.getImage())
                .unit(dto.getUnit() != null && !dto.getUnit().isBlank() ? dto.getUnit() : "pcs")
                .category(category)
                .store(store)
                .branch(branch)
                .taxRate(dto.getTaxRate() != null ? dto.getTaxRate() : 0.0)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }
}