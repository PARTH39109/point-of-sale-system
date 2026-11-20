package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Refund;
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
public interface RefundRepository extends JpaRepository<Refund, Long> {

    Optional<Refund> findByRefundNumber(String refundNumber);

    List<Refund> findByOrderId(Long orderId);

    Page<Refund> findByOrderStoreId(Long storeId, Pageable pageable);

    @Query("SELECT r FROM Refund r WHERE r.order.store.id = :storeId " +
           "AND r.createdAt BETWEEN :start AND :end")
    Page<Refund> findByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    /** Sum of all refunded amounts for an order */
    @Query("SELECT COALESCE(SUM(r.refundAmount), 0) FROM Refund r " +
           "WHERE r.order.id = :orderId AND r.refundStatus = 'COMPLETED'")
    Double sumRefundedAmountByOrderId(@Param("orderId") Long orderId);

    /** Count pending refunds for a branch */
    @Query("SELECT COUNT(r) FROM Refund r WHERE r.order.branch.id = :branchId " +
           "AND r.refundStatus = 'PENDING'")
    Long countPendingRefundsByBranch(@Param("branchId") Long branchId);

    @Query("SELECT r FROM Refund r WHERE r.order.cashier.id = :cashierId AND r.createdAt BETWEEN :start AND :end ORDER BY r.createdAt DESC")
    List<Refund> findByCashierAndDateRange(@Param("cashierId") Long cashierId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

}

