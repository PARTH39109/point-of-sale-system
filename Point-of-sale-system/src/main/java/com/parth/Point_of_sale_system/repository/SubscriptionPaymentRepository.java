package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, Long> {
    List<SubscriptionPayment> findByStoreIdOrderByCreatedAtDesc(Long storeId);
    Optional<SubscriptionPayment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<SubscriptionPayment> findByInvoiceNumberAndStoreId(String invoiceNumber, Long storeId);
}