package com.parth.Point_of_sale_system.payload.dto;

import lombok.Data;

@Data
public class ManagerProfileUpdateDto {
    private String fullName;
    private String phone;
    private String email;
    private String password;
    private String profilePicture;
}
