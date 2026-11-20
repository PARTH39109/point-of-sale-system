package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.domain.PaymentStatus;
import com.parth.Point_of_sale_system.modal.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    List<Payment> findByOrderId(Long orderId);

    List<Payment> findByOrderIdAndPaymentStatus(Long orderId, PaymentStatus status);

    Page<Payment> findByOrderStoreId(Long storeId, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.order.store.id = :storeId " +
           "AND p.createdAt BETWEEN :start AND :end")
    Page<Payment> findByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    /** Sum of all SUCCESS/PAID amounts for an order (for overpayment guard) */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.order.id = :orderId " +
           "AND p.paymentStatus IN ('PAID', 'SUCCESS')")
    Double sumSuccessfulPaymentsByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT p FROM Payment p WHERE p.order.cashier.id = :cashierId AND p.createdAt BETWEEN :start AND :end AND p.paymentStatus IN ('PAID','SUCCESS')")
    List<Payment> findByCashierAndDateRange(@Param("cashierId") Long cashierId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Payment p WHERE p.order.branch.id = :branchId AND p.createdAt BETWEEN :start AND :end AND p.paymentStatus IN ('PAID','SUCCESS')")
    Double sumPaymentsByBranchAndDateRange(@Param("branchId") Long branchId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount),0) FROM Payment p WHERE p.order.store.id = :storeId AND p.createdAt BETWEEN :start AND :end AND p.paymentStatus IN ('PAID','SUCCESS')")
    Double sumPaymentsByStoreAndDateRange(@Param("storeId") Long storeId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

}
