package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.InventoryDto;
import com.parth.Point_of_sale_system.payload.dto.StockMovementDto;
import com.parth.Point_of_sale_system.payload.request.UpdateStockRequest;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.service.InventoryService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final UserService userService;
    private final EmployeeRepository employeeRepository;


    @PostMapping("/stock")
    public ResponseEntity<InventoryDto> addOrUpdateStock(
            @RequestBody UpdateStockRequest request,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(inventoryService.addOrUpdateStock(
                request.getProductId(),
                request.getBranchId(),
                request.getQuantity(),
                request.getType(),
                request.getReason(),
                request.getMinStockLevel(),
                request.getMaxStockLevel(),
                user
        ));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<InventoryDto>> getInventoryByBranch(
            @PathVariable Long branchId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(inventoryService.getInventoryByBranch(branchId, user));
    }

    @GetMapping("/branch/{branchId}/low-stock")
    public ResponseEntity<List<InventoryDto>> getLowStockAlerts(
            @PathVariable Long branchId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(inventoryService.getLowStockAlerts(branchId, user));
    }

    @GetMapping("/branch/{branchId}/movements")
    public ResponseEntity<List<StockMovementDto>> getStockMovements(
            @PathVariable Long branchId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(inventoryService.getStockMovements(branchId, user));
    }

    // ── Manager self-service: auto-resolves branch from employee profile ────────
    @GetMapping("/me")
    public ResponseEntity<List<InventoryDto>> getMyBranchInventory(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        Long branchId = resolveManagerBranchId(user);
        List<InventoryDto> result = inventoryService.getInventoryForOwnBranch(branchId);
        System.out.println("========== InventoryController /me ==========");
        System.out.println("User        : " + user.getEmail());
        System.out.println("Role        : " + user.getRole());
        System.out.println("Resolved branchId : " + branchId);
        System.out.println("Branch name : " + (result.isEmpty() ? "(no rows to read name from)" : result.get(0).getBranchName()));
        System.out.println("Rows returned : " + result.size());
        System.out.println("===============================================");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me/low-stock")
    public ResponseEntity<List<InventoryDto>> getMyBranchLowStock(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        Long branchId = resolveManagerBranchId(user);
        List<InventoryDto> result = inventoryService.getLowStockForOwnBranch(branchId);
        List<InventoryDto> allForBranch = inventoryService.getInventoryForOwnBranch(branchId);
        System.out.println("========== InventoryController /me/low-stock ==========");
        System.out.println("User        : " + user.getEmail());
        System.out.println("Resolved branchId : " + branchId);
        System.out.println("Branch name : " + (allForBranch.isEmpty() ? "(no inventory rows for this branch at all)" : allForBranch.get(0).getBranchName()));
        System.out.println("Total inventory rows for this branch : " + allForBranch.size());
        allForBranch.forEach(inv -> System.out.println("   -> " + inv.getProductName() + " | qty=" + inv.getQuantity() + " | min=" + inv.getMinStockLevel()));
        System.out.println("Low-stock rows returned : " + result.size());
        System.out.println("=========================================================");
        return ResponseEntity.ok(result);
    }

    private Long resolveManagerBranchId(User user) throws Exception {
        return employeeRepository.findByUserId(user.getId())
                .map(emp -> emp.getBranch() != null ? emp.getBranch().getId() : null)
                .filter(id -> id != null)
                .orElseThrow(() -> new Exception("Employee is not assigned to any branch"));
    }
}