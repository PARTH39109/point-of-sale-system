package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CustomerDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.service.CustomerService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/customer")
public class CustomerController {

    private final CustomerService customerService;
    private final UserService userService;
    private final StoreRepository storeRepository;
    private final EmployeeRepository employeeRepository;

    private Long resolveStoreId(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) {
                throw new Exception("No store associated with this store admin");
            }
            return store.getId();
        }
        Store store = user.getStore();
        if (store == null) {
            throw new Exception("You are not associated with any store");
        }
        return store.getId();
    }

    private Long resolveBranchId(User user) {
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_CASHIER) {
            return employeeRepository.findByUserId(user.getId())
                    .map(emp -> emp.getBranch() != null ? emp.getBranch().getId() : null)
                    .orElse(null);
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(
            @RequestBody CustomerDto customerDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(customerService.createCustomer(customerDto, user));
    }

    @GetMapping
    public ResponseEntity<List<CustomerDto>> getCustomersByStore(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        // Cashiers and branch managers see only their branch's customers
        Long branchId = resolveBranchId(user);
        if (branchId != null) {
            return ResponseEntity.ok(customerService.getCustomersByBranchId(branchId));
        }
        Long storeId = resolveStoreId(user);
        return ResponseEntity.ok(customerService.getCustomersByStoreId(storeId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CustomerDto>> searchCustomers(
            @RequestParam("query") String query,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        Long branchId = resolveBranchId(user);
        if (branchId != null) {
            return ResponseEntity.ok(customerService.searchCustomersByBranch(branchId, query));
        }
        Long storeId = resolveStoreId(user);
        return ResponseEntity.ok(customerService.searchCustomers(storeId, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDto> getCustomerById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(customerService.getCustomerById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDto> updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerDto customerDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(customerService.updateCustomer(id, customerDto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCustomer(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        customerService.deleteCustomer(id, user);
        return ResponseEntity.ok(new ApiResponse("Customer deleted successfully", true));
    }
}