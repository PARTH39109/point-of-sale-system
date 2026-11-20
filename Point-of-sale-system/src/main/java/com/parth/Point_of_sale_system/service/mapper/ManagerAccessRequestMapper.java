package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.ManagerAccessRequest;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestDto;

public class ManagerAccessRequestMapper {

    public static AccessRequestDto toDto(ManagerAccessRequest request) {
        if (request == null) {
            return null;
        }

        return AccessRequestDto.builder()
                .id(request.getId())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .requestedRole(request.getRequestedRole())
                .storeId(request.getStore() != null ? request.getStore().getId() : null)
                .storeName(request.getStore() != null ? request.getStore().getBrand() : null)
                .branchId(request.getBranch() != null ? request.getBranch().getId() : null)
                .branchName(request.getBranch() != null ? request.getBranch().getName() : null)
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .approvedByName(request.getApprovedBy() != null ? request.getApprovedBy().getFullName() : null)
                .approvedAt(request.getApprovedAt())
                .rejectionReason(request.getRejectionReason())
                .build();
    }
}