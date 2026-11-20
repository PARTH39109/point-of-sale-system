package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.AccessRequestStatus;
import com.parth.Point_of_sale_system.domain.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessRequestDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole requestedRole;
    private Long storeId;
    private String storeName;
    private Long branchId;
    private String branchName;
    private AccessRequestStatus status;
    private LocalDateTime createdAt;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String rejectionReason;
}