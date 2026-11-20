package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.domain.OrderStatus;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;
import com.parth.Point_of_sale_system.payload.dto.OrderRequest;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.service.OrderService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final EmployeeRepository employeeRepository;

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@RequestBody OrderRequest request,
                                                @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        OrderDto order = orderService.createOrder(request, user);
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<OrderDto>> getOrders(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String dir) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(dir), sortBy));

        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_STORE_MANAGER) {
            Long branchId = employeeRepository.findByUserId(user.getId())
                    .map(emp -> emp.getBranch() != null ? emp.getBranch().getId() : null)
                    .orElseThrow(() -> new Exception("Manager is not assigned to any branch"));
            Page<OrderDto> orders = orderService.getOrdersByBranch(branchId, pageable);
            return new ResponseEntity<>(orders, HttpStatus.OK);
        }

        Long storeId = userService.resolveStoreForUser(user).getId();
        Page<OrderDto> orders = orderService.getOrdersByStore(storeId, pageable);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id,
                                                 @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        OrderDto order = orderService.getOrderById(id, user);
        return new ResponseEntity<>(order, HttpStatus.OK);
    }

    @GetMapping("/order-number/{orderNumber}")
    public ResponseEntity<OrderDto> getOrderByOrderNumber(@PathVariable String orderNumber,
                                                          @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        OrderDto order = orderService.getOrderByOrderNumber(orderNumber, user);
        return new ResponseEntity<>(order, HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        OrderDto order = orderService.updateOrderStatus(id, status, user);
        return new ResponseEntity<>(order, HttpStatus.OK);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Page<OrderDto>> getOrdersByCustomer(
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String dir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(dir), sortBy));
        Page<OrderDto> orders = orderService.getOrdersByCustomer(customerId, pageable);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<Page<OrderDto>> getOrdersByBranch(
            @PathVariable Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String dir) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(dir), sortBy));
        Page<OrderDto> orders = orderService.getOrdersByBranch(branchId, pageable);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/date-range")
    public ResponseEntity<Page<OrderDto>> getOrdersByDateRange(
            @RequestHeader("Authorization") String jwt,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String dir) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        Long storeId = userService.resolveStoreForUser(user).getId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(dir), sortBy));
        Page<OrderDto> orders = orderService.getOrdersByDateRange(storeId, start, end, pageable);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    /**
     * Links a customer to an existing order.
     * Called by the cashier's PaymentModal after the customer is captured.
     */
    @PatchMapping("/{id}/customer")
    public ResponseEntity<Void> linkCustomer(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal User user) {
        try {
            orderService.linkCustomerToOrder(id, body.get("customerId"), user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

}