package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.service.EnterpriseReportingService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportingController {

    private final EnterpriseReportingService reportingService;
    private final UserService userService;

    @GetMapping("/{type}")
    public ResponseEntity<List<Map<String, Object>>> getReport(
            @RequestHeader("Authorization") String jwt,
            @PathVariable String type,
            @RequestParam(defaultValue = "month") String range) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        List<Map<String, Object>> response;

        switch (type.toLowerCase()) {
            case "sales": response = reportingService.generateSalesReport(user, range); break;
            case "branches": response = reportingService.generateBranchReport(user, range); break;
            case "products": response = reportingService.generateProductReport(user, range); break;
            case "inventory": response = reportingService.generateInventoryReport(user); break;
            case "refunds": response = reportingService.generateRefundReport(user, range); break;
            case "payments": response = reportingService.generatePaymentReport(user, range); break;
            case "employees": response = reportingService.generateEmployeeReport(user); break;
            case "customers": response = reportingService.generateCustomerReport(user, range); break;
            case "categories": response = reportingService.generateCategoryReport(user, range); break;
            default: throw new Exception("Invalid report type");
        }

        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
