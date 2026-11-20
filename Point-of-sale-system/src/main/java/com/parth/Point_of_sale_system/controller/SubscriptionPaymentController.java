package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.*;
import com.parth.Point_of_sale_system.service.SubscriptionPaymentService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscription-payment")
@RequiredArgsConstructor
public class SubscriptionPaymentController {

    private final SubscriptionPaymentService subscriptionPaymentService;
    private final UserService userService;

    @PostMapping("/create-order")
    public ResponseEntity<CreateSubscriptionOrderResponse> createOrder(
            @RequestBody CreateSubscriptionOrderRequest request,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(subscriptionPaymentService.createOrder(request, user));
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifySubscriptionPaymentResponse> verifyPayment(
            @RequestBody VerifySubscriptionPaymentRequest request,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(subscriptionPaymentService.verifyPayment(request, user));
    }

    @GetMapping("/history")
    public ResponseEntity<List<SubscriptionPaymentHistoryDto>> getHistory(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(subscriptionPaymentService.getHistory(user));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    public ResponseEntity<SubscriptionInvoiceDto> getInvoice(
            @PathVariable String invoiceNumber,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(subscriptionPaymentService.getInvoice(invoiceNumber, user));
    }

    @GetMapping("/invoice/{invoiceNumber}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable String invoiceNumber,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        byte[] pdf = subscriptionPaymentService.generateInvoicePdf(invoiceNumber, user);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + invoiceNumber + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}