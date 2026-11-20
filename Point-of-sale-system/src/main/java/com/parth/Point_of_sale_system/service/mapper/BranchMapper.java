package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.payload.dto.BranchDto;

public class BranchMapper {

    public static BranchDto toDto(Branch branch) {
        if (branch == null) {
            return null;
        }

        return BranchDto.builder()
                .id(branch.getId())
                .name(branch.getName())
                .storeId(branch.getStore() != null ? branch.getStore().getId() : null)
                .address(branch.getAddress())
                .phone(branch.getPhone())
                .email(branch.getEmail())
                .managerName(branch.getManagerName())
                .isActive(branch.getIsActive())
                .createdAt(branch.getCreatedAt())
                .updatedAt(branch.getUpdatedAt())
                .build();
    }

    public static Branch toEntity(BranchDto dto, Store store) {
        if (dto == null) {
            return null;
        }

        return Branch.builder()
                .id(dto.getId())
                .name(dto.getName())
                .store(store)
                .address(dto.getAddress())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .managerName(dto.getManagerName())
                .isActive(dto.getIsActive())
                .build();
    }
}
