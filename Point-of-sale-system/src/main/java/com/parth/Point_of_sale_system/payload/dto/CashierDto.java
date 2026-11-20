package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashierDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private Double salary;
    private Boolean isActive;
    private LocalDateTime joiningDate;
    private Long branchId;
    private String branchName;
    private Long storeId;
    private LocalDateTime createdAt;
}