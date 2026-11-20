package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;
import com.parth.Point_of_sale_system.service.InvoiceService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final UserService userService;

    @GetMapping("/{invoiceNumber}")
    public ResponseEntity<OrderDto> getInvoiceByInvoiceNumber(
            @PathVariable String invoiceNumber,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        OrderDto invoice = invoiceService.getInvoiceByInvoiceNumber(invoiceNumber, user);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<OrderDto> getInvoiceByOrderId(
            @PathVariable Long orderId,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        OrderDto invoice = invoiceService.getInvoiceByOrderId(orderId, user);
        return ResponseEntity.ok(invoice);
    }

    @GetMapping("/download/{invoiceNumber}")
    public ResponseEntity<byte[]> downloadInvoicePdf(
            @PathVariable String invoiceNumber,
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        byte[] pdfBytes = invoiceService.generateInvoicePdf(invoiceNumber, user);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Invoice-" + invoiceNumber + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
