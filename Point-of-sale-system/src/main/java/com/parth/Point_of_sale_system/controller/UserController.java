package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.UserDto;
import com.parth.Point_of_sale_system.service.UserService;
import com.parth.Point_of_sale_system.service.mapper.UserMapped;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService ;

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getUserProfile(
          @RequestHeader("Authorization") String jwt
    ) throws UserException {
       User user = userService.getUserfromJwtToken(jwt);
       return ResponseEntity.ok(UserMapped.userDto(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(
            @RequestHeader("Authorization") String jwt ,
            @PathVariable Long id
    ) throws UserException, Exception {
        User user = userService.getUserById(id);

        if(user==null) {
            throw new UserException("User not found");
        }

        return ResponseEntity.ok(UserMapped.userDto(user));
    }



}
