package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.AuditLog;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.AboutStoreDto;
import com.parth.Point_of_sale_system.payload.dto.ChangePasswordRequest;
import com.parth.Point_of_sale_system.payload.dto.StoreSettingsDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.service.StoreSettingsService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/store/settings")
public class EnterpriseSettingsController {

    private final StoreSettingsService storeSettingsService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<StoreSettingsDto> getSettings(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(storeSettingsService.getSettingsForCurrentUser(user));
    }

    @PutMapping
    public ResponseEntity<StoreSettingsDto> updateSettings(
            @RequestBody StoreSettingsDto settings,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(storeSettingsService.updateSettingsForCurrentUser(settings, user));
    }

    @GetMapping("/about")
    public ResponseEntity<AboutStoreDto> getAboutInfo(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(storeSettingsService.getAboutStoreInfo(user));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(storeSettingsService.getAuditLogs(user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            @RequestBody ChangePasswordRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        storeSettingsService.changePassword(user, request);
        return ResponseEntity.ok(new ApiResponse("Password updated successfully", true));
    }
}
