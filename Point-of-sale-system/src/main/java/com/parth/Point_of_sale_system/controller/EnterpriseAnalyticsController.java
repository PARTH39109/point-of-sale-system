package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.EnterpriseAnalyticsResponse;
import com.parth.Point_of_sale_system.service.EnterpriseAnalyticsService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics/store")
@RequiredArgsConstructor
public class EnterpriseAnalyticsController {

    private final EnterpriseAnalyticsService enterpriseAnalyticsService;
    private final UserService userService;

    /**
     * GET /api/analytics/store/dashboard?range=month
     * range: "today" | "week" | "month"
     */
    @GetMapping("/dashboard")
    public ResponseEntity<EnterpriseAnalyticsResponse> getEnterpriseDashboard(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(defaultValue = "month") String range) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        EnterpriseAnalyticsResponse response = enterpriseAnalyticsService.getEnterpriseDashboardAnalytics(user, range);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
