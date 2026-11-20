package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.PaymentDto;
import com.parth.Point_of_sale_system.payload.dto.PaymentRequest;
import com.parth.Point_of_sale_system.service.PaymentService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;

    /**
     * Process a payment (single or split).
     * The cashier must be authenticated.
     */
    @PostMapping
    public ResponseEntity<List<PaymentDto>> processPayment(
            @RequestBody PaymentRequest request,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User cashier = userService.getUserfromJwtToken(jwt);
        List<PaymentDto> payments = paymentService.processPayment(request, cashier);
        return new ResponseEntity<>(payments, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto> getPaymentById(@PathVariable Long id) throws Exception {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentDto>> getPaymentsByOrder(@PathVariable Long orderId) throws Exception {
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }

    @GetMapping("/reference/{paymentReference}")
    public ResponseEntity<PaymentDto> getPaymentByReference(
            @PathVariable String paymentReference) throws Exception {
        return ResponseEntity.ok(paymentService.getPaymentByReference(paymentReference));
    }

    @GetMapping("/date-range")
    public ResponseEntity<Page<PaymentDto>> getPaymentsByDateRange(
            @RequestHeader("Authorization") String jwt,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String dir) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        Long storeId = userService.resolveStoreForUser(user).getId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(dir), sortBy));
        return ResponseEntity.ok(paymentService.getPaymentsByDateRange(storeId, start, end, pageable));
    }
}
