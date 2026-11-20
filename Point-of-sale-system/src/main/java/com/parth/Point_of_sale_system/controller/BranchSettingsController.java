package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.BranchSettingsDto;
import com.parth.Point_of_sale_system.payload.dto.ManagerProfileUpdateDto;
import com.parth.Point_of_sale_system.service.BranchSettingsService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/branch/settings")
public class BranchSettingsController {

    private final BranchSettingsService branchSettingsService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<BranchSettingsDto> getSettings(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchSettingsService.getSettingsForCurrentUser(user));
    }

    @PutMapping
    public ResponseEntity<BranchSettingsDto> updateSettings(
            @RequestBody BranchSettingsDto settings,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchSettingsService.updateSettingsForCurrentUser(settings, user));
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> syncSettings(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        branchSettingsService.synchronizeBranchData(user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @RequestBody ManagerProfileUpdateDto profileDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchSettingsService.updateManagerProfile(user, profileDto));
    }
}
