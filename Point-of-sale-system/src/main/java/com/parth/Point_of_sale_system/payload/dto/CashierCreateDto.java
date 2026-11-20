package com.parth.Point_of_sale_system.payload.dto;

import lombok.Data;

@Data
public class CashierCreateDto {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private Double salary;
    // Only used/required when an Admin creates a cashier directly.
    // For a Branch Manager, the branch is always auto-resolved server-side and this is ignored.
    private Long branchId;
}