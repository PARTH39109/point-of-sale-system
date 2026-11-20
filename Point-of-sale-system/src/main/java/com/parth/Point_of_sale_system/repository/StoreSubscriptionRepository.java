package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.StoreSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreSubscriptionRepository extends JpaRepository<StoreSubscription, Long> {
    Optional<StoreSubscription> findByStoreId(Long storeId);
}
