package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CashierCreateDto;
import com.parth.Point_of_sale_system.payload.dto.CashierDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.service.CashierService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cashier")
public class CashierController {

    private final CashierService cashierService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','BRANCH_MANAGER','STORE_MANAGER')")
    public ResponseEntity<CashierDto> createCashier(
            @RequestBody CashierCreateDto dto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(cashierService.createCashier(dto, user));
    }

    @GetMapping
    public ResponseEntity<List<CashierDto>> getCashiers(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(cashierService.getCashiersForCurrentUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CashierDto> getCashierById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(cashierService.getCashierById(id, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BRANCH_MANAGER','STORE_MANAGER')")
    public ResponseEntity<CashierDto> updateCashier(
            @PathVariable Long id,
            @RequestBody CashierCreateDto dto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(cashierService.updateCashier(id, dto, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BRANCH_MANAGER','STORE_MANAGER')")
    public ResponseEntity<ApiResponse> deleteCashier(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        cashierService.deleteCashier(id, user);
        return ResponseEntity.ok(new ApiResponse("Cashier removed successfully"));
    }
}