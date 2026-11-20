package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.UserRole;
import lombok.Data;

@Data
public class AccessRequestCreateDto {
    private String fullName;
    private String email;
    private String phone;
    private String password;
    private UserRole role;
    private Long storeId;
    private Long branchId;
}