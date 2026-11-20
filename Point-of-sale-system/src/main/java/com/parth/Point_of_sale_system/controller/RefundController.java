package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.RefundDto;
import com.parth.Point_of_sale_system.payload.dto.RefundRequest;
import com.parth.Point_of_sale_system.service.RefundService;
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
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<RefundDto> processRefund(
            @RequestBody RefundRequest request,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        RefundDto refund = refundService.processRefund(request, user);
        return new ResponseEntity<>(refund, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<RefundDto>> getRefunds(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String dir) throws Exception {
        
        User user = userService.getUserfromJwtToken(jwt);
        Long storeId = userService.resolveStoreForUser(user).getId();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(dir), sortBy));
        return ResponseEntity.ok(refundService.getRefundsByStore(storeId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RefundDto> getRefundById(@PathVariable Long id) throws Exception {
        return ResponseEntity.ok(refundService.getRefundById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<RefundDto>> getRefundsByOrder(@PathVariable Long orderId) throws Exception {
        return ResponseEntity.ok(refundService.getRefundsByOrderId(orderId));
    }

    @GetMapping("/refund-number/{refundNumber}")
    public ResponseEntity<RefundDto> getRefundByRefundNumber(@PathVariable String refundNumber) throws Exception {
        return ResponseEntity.ok(refundService.getRefundByRefundNumber(refundNumber));
    }

    @GetMapping("/date-range")
    public ResponseEntity<Page<RefundDto>> getRefundsByDateRange(
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
        return ResponseEntity.ok(refundService.getRefundsByDateRange(storeId, start, end, pageable));
    }
}
