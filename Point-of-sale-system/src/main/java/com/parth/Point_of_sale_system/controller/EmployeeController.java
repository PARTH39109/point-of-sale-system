package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.EmployeeDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.service.EmployeeService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/employee")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserService userService;

    // Staff only — never creates login credentials
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','BRANCH_MANAGER','STORE_MANAGER')")
    public ResponseEntity<EmployeeDto> createEmployee(
            @RequestBody EmployeeDto employeeDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(employeeService.createEmployee(employeeDto, user));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDto>> getStaff(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(employeeService.getStaffForCurrentUser(user));
    }

    // Admin-only cross-branch view of Branch Managers
    @GetMapping("/managers")
    @PreAuthorize("hasAnyRole('ADMIN','STORE_ADMIN')")
    public ResponseEntity<List<EmployeeDto>> getManagers(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(employeeService.getManagersForCurrentUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployeeById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(employeeService.getEmployeeById(id, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BRANCH_MANAGER','STORE_MANAGER')")
    public ResponseEntity<EmployeeDto> updateEmployee(
            @PathVariable Long id,
            @RequestBody EmployeeDto employeeDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(employeeService.updateEmployee(id, employeeDto, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','BRANCH_MANAGER','STORE_MANAGER')")
    public ResponseEntity<ApiResponse> deleteEmployee(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        employeeService.deleteEmployee(id, user);
        return ResponseEntity.ok(new ApiResponse("Employee deleted successfully"));
    }

    @PutMapping("/managers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STORE_ADMIN')")
    public ResponseEntity<EmployeeDto> updateManager(
            @PathVariable Long id,
            @RequestBody EmployeeDto employeeDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(employeeService.updateManager(id, employeeDto, user));
    }

    @DeleteMapping("/managers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STORE_ADMIN')")
    public ResponseEntity<ApiResponse> deleteManager(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        employeeService.deleteManager(id, user);
        return ResponseEntity.ok(new ApiResponse("Branch Manager removed successfully"));
    }


}