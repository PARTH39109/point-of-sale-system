package com.parth.Point_of_sale_system.controller;


import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestCreateDto;
import com.parth.Point_of_sale_system.payload.dto.BranchOptionDto;
import com.parth.Point_of_sale_system.payload.dto.StoreOptionDto;
import com.parth.Point_of_sale_system.payload.dto.UserDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.payload.response.AuthResponse;
import com.parth.Point_of_sale_system.service.AuthService;
import com.parth.Point_of_sale_system.service.ManagerAccessRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor

public class AuthController {
    private final AuthService authService ;
    private final ManagerAccessRequestService managerAccessRequestService;

    // Localhost:5000/auth/register

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> signupHandler(
            @RequestBody UserDto userDto
    ) throws UserException {
        return ResponseEntity.ok(
                authService.register(userDto)
        );
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginHandler(
            @RequestBody UserDto userDto
    ) throws UserException {
        return ResponseEntity.ok(
                authService.login(userDto)
        );
    }

    @GetMapping("/stores")
    public ResponseEntity<List<StoreOptionDto>> getStoresForRegistration() {
        return ResponseEntity.ok(managerAccessRequestService.getAvailableStores());
    }

    @GetMapping("/stores/{storeId}/branches")
    public ResponseEntity<List<BranchOptionDto>> getBranchesForRegistration(
            @PathVariable Long storeId
    ) throws Exception {
        return ResponseEntity.ok(managerAccessRequestService.getBranchesForStore(storeId));
    }

    @PostMapping("/access-request")
    public ResponseEntity<ApiResponse> requestAccess(
            @RequestBody AccessRequestCreateDto accessRequestCreateDto
    ) throws UserException {
        return ResponseEntity.ok(
                managerAccessRequestService.createRequest(accessRequestCreateDto)
        );
    }

}