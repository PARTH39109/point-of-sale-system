package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.domain.SubscriptionType;
import com.parth.Point_of_sale_system.modal.SubscriptionHistory;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.SubscriptionPlanInfo;
import com.parth.Point_of_sale_system.payload.response.SubscriptionPlanResponse;
import com.parth.Point_of_sale_system.payload.response.SubscriptionUsageResponse;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserService userService;

    @GetMapping("/my-plan")
    public ResponseEntity<SubscriptionPlanResponse> getMyPlan(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return new ResponseEntity<>(subscriptionService.getMyPlan(userService.resolveStoreForUser(user).getId()), HttpStatus.OK);
    }

    @GetMapping("/usage")
    public ResponseEntity<SubscriptionUsageResponse> getUsage(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return new ResponseEntity<>(subscriptionService.getUsage(userService.resolveStoreForUser(user).getId()), HttpStatus.OK);
    }

    @GetMapping("/history")
    public ResponseEntity<List<SubscriptionHistory>> getHistory(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return new ResponseEntity<>(subscriptionService.getHistory(userService.resolveStoreForUser(user).getId()), HttpStatus.OK);
    }

    @PostMapping("/upgrade")
    public ResponseEntity<String> upgradePlan(
            @RequestHeader("Authorization") String jwt,
            @RequestParam SubscriptionType newType) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        subscriptionService.upgradePlan(userService.resolveStoreForUser(user).getId(), newType);
        return new ResponseEntity<>("Plan upgraded successfully", HttpStatus.OK);
    }

    @PostMapping("/renew")
    public ResponseEntity<String> renewPlan(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        subscriptionService.renewPlan(userService.resolveStoreForUser(user).getId());
        return new ResponseEntity<>("Plan renewed successfully", HttpStatus.OK);
    }

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlanInfo>> getAllPlans() {
        return new ResponseEntity<>(subscriptionService.getAllPlans(), HttpStatus.OK);
    }
}
