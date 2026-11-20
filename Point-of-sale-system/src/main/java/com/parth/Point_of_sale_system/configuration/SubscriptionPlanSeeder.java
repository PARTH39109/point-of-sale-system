package com.parth.Point_of_sale_system.configuration;

import com.parth.Point_of_sale_system.domain.SubscriptionType;
import com.parth.Point_of_sale_system.modal.SubscriptionPlan;
import com.parth.Point_of_sale_system.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SubscriptionPlanSeeder implements CommandLineRunner {

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    public void run(String... args) {
        upsert(SubscriptionType.BASIC, "Basic Plan", 0.0, 2, 10, 100, 1000, false);
        upsert(SubscriptionType.PRO, "Pro Plan", 1999.0, 5, 25, 5000, 10000, false);
        upsert(SubscriptionType.ADVANCE, "Advance Plan", 4999.0, null, null, null, null, true);
    }

    private void upsert(SubscriptionType type, String name, Double price,
                        Integer maxBranches, Integer maxEmployees, Integer maxProducts,
                        Integer maxMonthlyOrders, boolean isUnlimited) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByType(type).orElseGet(SubscriptionPlan::new);
        plan.setType(type);
        plan.setName(name);
        plan.setPrice(price);
        plan.setDurationMonths(12);
        plan.setMaxBranches(maxBranches);
        plan.setMaxEmployees(maxEmployees);
        plan.setMaxProducts(maxProducts);
        plan.setMaxCustomers(null); // never capped, on any plan
        plan.setMaxMonthlyOrders(maxMonthlyOrders);
        plan.setIsUnlimited(isUnlimited);
        subscriptionPlanRepository.save(plan);
    }
}