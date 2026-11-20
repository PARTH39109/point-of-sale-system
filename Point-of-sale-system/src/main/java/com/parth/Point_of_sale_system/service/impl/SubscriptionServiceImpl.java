package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.SubscriptionStatus;
import com.parth.Point_of_sale_system.domain.SubscriptionType;
import com.parth.Point_of_sale_system.exception.SubscriptionLimitExceededException;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.StoreSubscription;
import com.parth.Point_of_sale_system.modal.SubscriptionHistory;
import com.parth.Point_of_sale_system.modal.SubscriptionPlan;
import com.parth.Point_of_sale_system.payload.response.SubscriptionPlanInfo;
import com.parth.Point_of_sale_system.payload.response.SubscriptionPlanResponse;
import com.parth.Point_of_sale_system.payload.response.SubscriptionUsageResponse;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionServiceImpl implements SubscriptionService {

    private final StoreSubscriptionRepository storeSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;
    private final StoreRepository storeRepository;

    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    @Override
    public void validateLimit(Long storeId, LimitType type) {
        StoreSubscription sub = storeSubscriptionRepository.findByStoreId(storeId)
                .orElseThrow(() -> new RuntimeException("No active subscription found for store"));

        if (sub.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new SubscriptionLimitExceededException("Your subscription is " + sub.getStatus().name() + ". Please renew.");
        }
        if (sub.getEndDate().isBefore(LocalDateTime.now())) {
            sub.setStatus(SubscriptionStatus.EXPIRED);
            storeSubscriptionRepository.save(sub);
            throw new SubscriptionLimitExceededException("Your subscription has expired. Please renew.");
        }

        SubscriptionPlan plan = sub.getPlan();

        // Advance plan (or any plan explicitly marked unlimited) bypasses every check below.
        if (Boolean.TRUE.equals(plan.getIsUnlimited())) {
            return;
        }

        switch (type) {
            case BRANCH:
                if (plan.getMaxBranches() == null) break; // null = unlimited for this specific resource
                long branches = branchRepository.countByStoreId(storeId);
                if (branches >= plan.getMaxBranches()) {
                    throw new SubscriptionLimitExceededException(
                            "Branch limit reached. Your current subscription (" + plan.getName() + ") allows only " +
                                    plan.getMaxBranches() + " branches. Upgrade your subscription to create more branches.");
                }
                break;

            case EMPLOYEE:
                if (plan.getMaxEmployees() == null) break;
                long employees = employeeRepository.countByStoreId(storeId);
                if (employees >= plan.getMaxEmployees()) {
                    throw new SubscriptionLimitExceededException(
                            "Employee limit reached. Your current plan supports only " + plan.getMaxEmployees() + " employees.");
                }
                break;

            case PRODUCT:
                if (plan.getMaxProducts() == null) break;
                long products = productRepository.countByStoreId(storeId);
                if (products >= plan.getMaxProducts()) {
                    throw new SubscriptionLimitExceededException(
                            "Product limit reached. Maximum allowed products for your plan: " + plan.getMaxProducts());
                }
                break;

            case CUSTOMER:
                // No plan defines a customer cap in this design — customers are always unlimited.
                break;

            case ORDER:
                if (plan.getMaxMonthlyOrders() == null) break;
                LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
                long orders = orderRepository.countOrdersByStoreAndDateRange(storeId, startOfMonth, LocalDateTime.now());
                if (orders >= plan.getMaxMonthlyOrders()) {
                    throw new SubscriptionLimitExceededException(
                            "Monthly order limit reached. Upgrade your subscription to continue billing.");
                }
                break;
        }
    }

    @Override
    public void assignDefaultSubscription(Store store) {
        SubscriptionPlan basicPlan = subscriptionPlanRepository.findByType(SubscriptionType.BASIC)
                .orElseThrow(() -> new RuntimeException("Basic plan not seeded — check SubscriptionPlanSeeder"));

        // Basic is a permanent free tier, not a trial — no forced expiry after a couple of weeks.
        StoreSubscription sub = StoreSubscription.builder()
                .store(store)
                .plan(basicPlan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusYears(100))
                .status(SubscriptionStatus.ACTIVE)
                .autoRenew(false)
                .build();

        storeSubscriptionRepository.save(sub);

        SubscriptionHistory hist = SubscriptionHistory.builder()
                .store(store)
                .plan(basicPlan)
                .action("INITIAL")
                .amountPaid(0.0)
                .build();
        subscriptionHistoryRepository.save(hist);
    }

    private StoreSubscription getOrCreateSubscriptionForStore(Long storeId) {
        return storeSubscriptionRepository.findByStoreId(storeId)
                .orElseGet(() -> {
                    Store store = storeRepository.findById(storeId).orElse(null);
                    if (store != null) {
                        assignDefaultSubscription(store);
                        return storeSubscriptionRepository.findByStoreId(storeId).orElse(null);
                    }
                    return null;
                });
    }

    @Override
    public SubscriptionPlanResponse getMyPlan(Long storeId) throws Exception {
        StoreSubscription sub = getOrCreateSubscriptionForStore(storeId);
        if (sub == null) {
            return SubscriptionPlanResponse.builder()
                    .planName("Basic")
                    .price(0.0)
                    .status("ACTIVE")
                    .startDate(LocalDateTime.now())
                    .endDate(LocalDateTime.now().plusYears(100))
                    .daysRemaining(36500)
                    .subscriptionType("BASIC")
                    .isUnlimited(false)
                    .renewalDate(LocalDateTime.now().plusYears(100))
                    .autoRenew(false)
                    .build();
        }

        return SubscriptionPlanResponse.builder()
                .planName(sub.getPlan().getName())
                .price(sub.getPlan().getPrice())
                .status(sub.getStatus().name())
                .startDate(sub.getStartDate())
                .endDate(sub.getEndDate())
                .daysRemaining((int) ChronoUnit.DAYS.between(LocalDateTime.now(), sub.getEndDate()))
                .subscriptionType(sub.getPlan().getType().name())
                .isUnlimited(sub.getPlan().getIsUnlimited())
                .renewalDate(sub.getEndDate())
                .autoRenew(sub.getAutoRenew())
                .build();
    }

    @Override
    public SubscriptionUsageResponse getUsage(Long storeId) throws Exception {
        StoreSubscription sub = getOrCreateSubscriptionForStore(storeId);
        SubscriptionPlan plan = sub != null ? sub.getPlan() : null;

        long branches = branchRepository.countByStoreId(storeId);
        long employees = employeeRepository.countByStoreId(storeId);
        long products = productRepository.countByStoreId(storeId);
        long customers = customerRepository.countByStoreId(storeId);

        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
        long orders = orderRepository.countOrdersByStoreAndDateRange(storeId, startOfMonth, LocalDateTime.now());

        Integer maxBranches = plan != null ? plan.getMaxBranches() : 2;
        Integer maxEmployees = plan != null ? plan.getMaxEmployees() : 5;
        Integer maxProducts = plan != null ? plan.getMaxProducts() : 50;
        Integer maxCustomers = plan != null ? plan.getMaxCustomers() : null;
        Integer maxMonthlyOrders = plan != null ? plan.getMaxMonthlyOrders() : 100;

        return SubscriptionUsageResponse.builder()
                .maxBranches(maxBranches)
                .usedBranches(branches)
                .branchUsagePercent(calc(branches, maxBranches))
                .maxEmployees(maxEmployees)
                .usedEmployees(employees)
                .employeeUsagePercent(calc(employees, maxEmployees))
                .maxProducts(maxProducts)
                .usedProducts(products)
                .productUsagePercent(calc(products, maxProducts))
                .maxCustomers(maxCustomers)
                .usedCustomers(customers)
                .customerUsagePercent(calc(customers, maxCustomers))
                .maxMonthlyOrders(maxMonthlyOrders)
                .usedMonthlyOrders(orders)
                .orderUsagePercent(calc(orders, maxMonthlyOrders))
                .build();
    }

    private Double calc(long used, Integer max) {
        if (max == null || max == 0) return 0.0; // null = unlimited, render as a full/neutral bar client-side
        return ((double) used / (double) max) * 100.0;
    }

    @Override
    public List<SubscriptionHistory> getHistory(Long storeId) throws Exception {
        return subscriptionHistoryRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
    }

    @Override
    public List<SubscriptionPlanInfo> getAllPlans() {
        return subscriptionPlanRepository.findAll().stream()
                .map(p -> SubscriptionPlanInfo.builder()
                        .id(p.getId())
                        .type(p.getType().name())
                        .type(p.getType().name())
                        .name(p.getName())
                        .price(p.getPrice())
                        .durationMonths(p.getDurationMonths())
                        .maxBranches(p.getMaxBranches())
                        .maxEmployees(p.getMaxEmployees())
                        .maxProducts(p.getMaxProducts())
                        .maxMonthlyOrders(p.getMaxMonthlyOrders())
                        .isUnlimited(p.getIsUnlimited())
                        .build())
                .sorted((a, b) -> Double.compare(a.getPrice(), b.getPrice()))
                .collect(Collectors.toList());
    }

    @Override
    public void upgradePlan(Long storeId, SubscriptionType newType) throws Exception {
        StoreSubscription sub = storeSubscriptionRepository.findByStoreId(storeId)
                .orElseThrow(() -> new Exception("No active subscription"));

        SubscriptionPlan newPlan = subscriptionPlanRepository.findByType(newType)
                .orElseThrow(() -> new Exception("Invalid plan type"));

        int months = newPlan.getDurationMonths() != null ? newPlan.getDurationMonths() : 12;

        sub.setPlan(newPlan);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartDate(LocalDateTime.now());
        sub.setEndDate(LocalDateTime.now().plusMonths(months));
        storeSubscriptionRepository.save(sub);

        SubscriptionHistory hist = SubscriptionHistory.builder()
                .store(sub.getStore())
                .plan(newPlan)
                .action("UPGRADE")
                .amountPaid(newPlan.getPrice())
                .build();
        subscriptionHistoryRepository.save(hist);
    }

    @Override
    public void renewPlan(Long storeId) throws Exception {
        StoreSubscription sub = storeSubscriptionRepository.findByStoreId(storeId)
                .orElseThrow(() -> new Exception("No active subscription"));

        int months = sub.getPlan().getDurationMonths() != null ? sub.getPlan().getDurationMonths() : 12;

        sub.setStatus(SubscriptionStatus.ACTIVE);
        LocalDateTime start = sub.getEndDate().isAfter(LocalDateTime.now()) ? sub.getEndDate() : LocalDateTime.now();
        sub.setEndDate(start.plusMonths(months));
        storeSubscriptionRepository.save(sub);

        SubscriptionHistory hist = SubscriptionHistory.builder()
                .store(sub.getStore())
                .plan(sub.getPlan())
                .action("RENEWAL")
                .amountPaid(sub.getPlan().getPrice())
                .build();
        subscriptionHistoryRepository.save(hist);
    }
}