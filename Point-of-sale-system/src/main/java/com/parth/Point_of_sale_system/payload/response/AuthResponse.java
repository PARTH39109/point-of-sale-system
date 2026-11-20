package com.parth.Point_of_sale_system.payload.response;

import com.parth.Point_of_sale_system.payload.dto.UserDto;
import lombok.Data;

@Data
public class AuthResponse {

    private String jwt;
    private String message;
    private UserDto user;
    
}
