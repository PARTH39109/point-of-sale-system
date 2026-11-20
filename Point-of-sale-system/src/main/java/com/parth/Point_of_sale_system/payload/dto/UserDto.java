package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.UserRole;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {

    private Long id;

    private String fullName;
    private String email;
    private String phone;
    private UserRole role ;
    private String password;

    // Required only when role == ROLE_STORE_ADMIN — the new Store is created
    // from this at registration time (see AuthServiceImpl.register).
    private String storeName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;

}