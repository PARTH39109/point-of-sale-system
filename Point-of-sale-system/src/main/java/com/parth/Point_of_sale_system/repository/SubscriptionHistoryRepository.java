package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.SubscriptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, Long> {
    List<SubscriptionHistory> findByStoreIdOrderByCreatedAtDesc(Long storeId);
}
