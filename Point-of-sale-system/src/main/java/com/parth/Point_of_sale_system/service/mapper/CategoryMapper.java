package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Category;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.payload.dto.CategoryDto;

public class CategoryMapper {

    public static CategoryDto toDto(Category category, Long productCount) {
        if (category == null) {
            return null;
        }

        Branch branch = category.getBranch();

        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .storeId(category.getStore() != null ? category.getStore().getId() : null)
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .isActive(category.getIsActive())
                .productCount(productCount != null ? productCount : 0L)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    public static Category toEntity(CategoryDto dto, Store store, Branch branch) {
        if (dto == null) {
            return null;
        }

        return Category.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .store(store)
                .branch(branch)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
    }
}