package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.payload.dto.UserDto;
import com.parth.Point_of_sale_system.modal.User;

public class UserMapped {

    public static UserDto userDto(User savedUser) {
        UserDto userDto = new UserDto();
        userDto.setFullName(savedUser.getFullName());
        userDto.setId(savedUser.getId());
        userDto.setEmail(savedUser.getEmail());
        userDto.setRole(savedUser.getRole());
        userDto.setCreatedAt(savedUser.getCreatedAt());
        userDto.setUpdatedAt(savedUser.getUpdatedAt());
        userDto.setLastLoginAt(savedUser.getLastLoginAt());
        userDto.setPhone(savedUser.getPhone());
        return userDto;
    }

}
