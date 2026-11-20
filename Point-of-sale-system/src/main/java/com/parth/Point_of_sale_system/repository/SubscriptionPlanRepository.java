package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.domain.SubscriptionType;
import com.parth.Point_of_sale_system.modal.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findByType(SubscriptionType type);
}
