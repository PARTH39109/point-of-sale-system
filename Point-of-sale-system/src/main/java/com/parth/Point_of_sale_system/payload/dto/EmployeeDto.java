package com.parth.Point_of_sale_system.payload.dto;

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
public class EmployeeDto {
    private Long id;
    private String fullName;
    private String phone;
    private String designation;   // Employee | Sales Staff | Housekeeping | Security | Stock Keeper | Helper | Delivery Boy | Other
    private Double salary;
    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime joiningDate;
    private String notes;
    private Boolean isActive;
    private Long branchId;
    private String branchName;
    private Long storeId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Read-only — populated only when this record has a linked login account (Manager/Cashier)
    private Long userId;
    private String email;
    private UserRole role;
    private Boolean hasLogin;
}