package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.payload.dto.UserDto;
import com.parth.Point_of_sale_system.payload.response.AuthResponse;

public interface AuthService {

    AuthResponse register(UserDto userDto) throws UserException;
    AuthResponse login(UserDto userDto) throws UserException;
}
