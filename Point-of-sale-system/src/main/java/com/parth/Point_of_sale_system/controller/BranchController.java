package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.BranchDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.service.BranchService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/branch")
public class BranchController {

    private final BranchService branchService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<BranchDto> createBranch(
            @RequestBody BranchDto branchDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchService.createBranch(branchDto, user));
    }

    @GetMapping
    public ResponseEntity<List<BranchDto>> getBranchesByStore(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchService.getBranchesByStore(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BranchDto> getBranchById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchService.getBranchById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BranchDto> updateBranch(
            @PathVariable Long id,
            @RequestBody BranchDto branchDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(branchService.updateBranch(id, branchDto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBranch(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        branchService.deleteBranch(id, user);
        return ResponseEntity.ok(new ApiResponse("Branch deleted successfully", true));
    }
}
