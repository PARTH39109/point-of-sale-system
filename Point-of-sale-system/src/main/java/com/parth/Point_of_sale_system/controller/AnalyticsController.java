package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BusinessIntelligenceResponse;
import com.parth.Point_of_sale_system.service.BusinessIntelligenceService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bi")
@RequiredArgsConstructor
public class AnalyticsController {

    private final BusinessIntelligenceService biService;
    private final UserService userService;

    @GetMapping("/dashboard")
    public ResponseEntity<BusinessIntelligenceResponse> getDashboard(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(defaultValue = "month") String range) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        BusinessIntelligenceResponse response = biService.getDashboardAnalytics(user, range);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}