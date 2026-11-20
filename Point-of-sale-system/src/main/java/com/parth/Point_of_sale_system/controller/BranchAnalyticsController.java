package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BranchAnalyticsResponse;
import com.parth.Point_of_sale_system.service.BranchAnalyticsService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics/branch")
@RequiredArgsConstructor
public class BranchAnalyticsController {

    private final BranchAnalyticsService analyticsService;
    private final UserService            userService;

    /**
     * GET /api/analytics/branch/dashboard?range=week
     * range: "today" | "week" | "month"
     */
    @GetMapping("/dashboard")
    public ResponseEntity<BranchAnalyticsResponse> getDashboard(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(defaultValue = "week") String range) throws Exception {

        User user = userService.getUserfromJwtToken(jwt);
        BranchAnalyticsResponse response = analyticsService.getDashboardAnalytics(user, range);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
