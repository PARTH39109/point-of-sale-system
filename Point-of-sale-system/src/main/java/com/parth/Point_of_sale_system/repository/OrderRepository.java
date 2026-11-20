package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberWithItems(@Param("orderNumber") String orderNumber);

    /**
     * Fetches the order AND its orderItems in a single JOIN FETCH query.
     * Prevents LazyInitializationException when orderItems is accessed
     * outside a transaction (e.g. in the invoice/PDF service).
     */
    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    Page<Order> findByStoreId(Long storeId, Pageable pageable);

    Page<Order> findByBranchId(Long branchId, Pageable pageable);

    // Eager-fetch orderItems for listing pages to avoid LazyInitializationException
    @Query(value = "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product WHERE o.branch.id = :branchId",
            countQuery = "SELECT COUNT(o) FROM Order o WHERE o.branch.id = :branchId")
    Page<Order> findByBranchIdWithItems(@Param("branchId") Long branchId, Pageable pageable);

    @Query(value = "SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.product WHERE o.store.id = :storeId",
            countQuery = "SELECT COUNT(o) FROM Order o WHERE o.store.id = :storeId")
    Page<Order> findByStoreIdWithItems(@Param("storeId") Long storeId, Pageable pageable);

    Page<Order> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.store.id = :storeId AND o.createdAt BETWEEN :startDate AND :endDate")
    Page<Order> findByDateRange(
            @Param("storeId") Long storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // ── Branch-scoped date range (with status filter) ─────────────────────────
    @Query("SELECT o FROM Order o WHERE o.branch.id = :branchId " +
            "AND o.createdAt BETWEEN :start AND :end")
    Page<Order> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    // ── Revenue KPIs ──────────────────────────────────────────────────────────
    @Query("SELECT COALESCE(SUM(o.grandTotal), 0) FROM Order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED')")
    Double sumRevenueByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED')")
    Long countOrdersByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(AVG(o.grandTotal), 0) FROM Order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED')")
    Double avgOrderValueByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── Store-level KPIs (for admin analytics) ────────────────────────────────
    @Query("""
        SELECT COALESCE(SUM(o.grandTotal),0)
        FROM Order o
        WHERE o.store.id = :storeId
        AND o.createdAt BETWEEN :start AND :end
        AND o.orderStatus NOT IN ('CANCELLED','REFUNDED')
       """)
    Double sumRevenueByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o " +
            "WHERE o.store.id = :storeId " +
            "AND o.createdAt BETWEEN :start AND :end")
    Long countOrdersByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(AVG(o.grandTotal), 0) FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED')")
    Double avgOrderValueByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(DISTINCT o.customer.id) FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.customer IS NOT NULL")
    Long countUniqueCustomersByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT CAST(o.createdAt AS date), SUM(o.grandTotal), COUNT(o) FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY CAST(o.createdAt AS date) ORDER BY CAST(o.createdAt AS date) ASC")
    List<Object[]> findDailyRevenueByStore(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT o.paymentMethod, COUNT(o), SUM(o.grandTotal) FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED') " +
            "GROUP BY o.paymentMethod ORDER BY SUM(o.grandTotal) DESC")
    List<Object[]> findPaymentMethodBreakdownByStore(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── Unique customers served ───────────────────────────────────────────────
    @Query("SELECT COUNT(DISTINCT o.customer.id) FROM Order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.customer IS NOT NULL")
    Long countUniqueCustomersByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── Top selling products by branch ────────────────────────────────────────
    @Query("SELECT oi.product.name, SUM(oi.quantity), SUM(oi.lineTotal) " +
            "FROM OrderItem oi JOIN oi.order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED') " +
            "GROUP BY oi.product.name ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopProductsByBranch(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    // ── Daily revenue aggregation for charting ────────────────────────────────
    @Query("SELECT FUNCTION('DATE', o.createdAt), COALESCE(SUM(o.grandTotal), 0), COUNT(o) " +
            "FROM Order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY FUNCTION('DATE', o.createdAt) ORDER BY FUNCTION('DATE', o.createdAt)")
    List<Object[]> findDailyRevenueByBranch(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
    // ── BI: Revenue Per Branch ────────────────────────────────────────────────
    @Query("SELECT o.branch.name, SUM(o.grandTotal), COUNT(o) " +
            "FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY o.branch.name ORDER BY SUM(o.grandTotal) DESC")
    List<Object[]> findRevenuePerBranch(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── BI: Revenue Per Category ──────────────────────────────────────────────
    @Query("SELECT c.name, SUM(oi.lineTotal), SUM(oi.quantity) " +
            "FROM OrderItem oi JOIN oi.order o JOIN oi.product p JOIN p.category c " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY c.name ORDER BY SUM(oi.lineTotal) DESC")
    List<Object[]> findRevenuePerCategory(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── BI: Peak Sales Hours ──────────────────────────────────────────────────
    @Query("SELECT FUNCTION('HOUR', o.createdAt), COUNT(o), SUM(o.grandTotal) " +
            "FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY FUNCTION('HOUR', o.createdAt) ORDER BY FUNCTION('HOUR', o.createdAt) ASC")
    List<Object[]> findPeakSalesHours(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── BI: Peak Sales Days ───────────────────────────────────────────────────
    @Query("SELECT FUNCTION('DAYOFWEEK', o.createdAt), COUNT(o), SUM(o.grandTotal) " +
            "FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY FUNCTION('DAYOFWEEK', o.createdAt) ORDER BY FUNCTION('DAYOFWEEK', o.createdAt) ASC")
    List<Object[]> findPeakSalesDays(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── BI: Top Cashiers ──────────────────────────────────────────────────────
    @Query("SELECT e.fullName, COUNT(o), SUM(o.grandTotal) " +
            "FROM Order o JOIN o.cashier e " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY e.fullName ORDER BY SUM(o.grandTotal) DESC")
    List<Object[]> findTopCashiers(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);
    // ── Payment method breakdown ───────────────────────────────────────────────
    @Query("SELECT o.paymentMethod, COUNT(o), COALESCE(SUM(o.grandTotal), 0) " +
            "FROM Order o " +
            "WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY o.paymentMethod")
    List<Object[]> findPaymentMethodBreakdownByBranch(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // ── Recent orders for a branch ────────────────────────────────────────────
    List<Order> findTop10ByBranchIdOrderByCreatedAtDesc(Long branchId);

    // ── Recent orders for a store ─────────────────────────────────────────────
    List<Order> findTop10ByStoreIdOrderByCreatedAtDesc(Long storeId);

    // ── Top selling products by store ────────────────────────────────────────
    @Query("SELECT oi.product.name, SUM(oi.quantity), SUM(oi.lineTotal) " +
            "FROM OrderItem oi JOIN oi.order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED') " +
            "GROUP BY oi.product.name ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopProductsByStore(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    // ── Top performing branches ───────────────────────────────────────────────
    @Query("SELECT o.branch.name, SUM(o.grandTotal), COUNT(o) " +
            "FROM Order o " +
            "WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end " +
            "AND o.orderStatus NOT IN ('CANCELLED', 'REFUNDED') " +
            "GROUP BY o.branch.name ORDER BY SUM(o.grandTotal) DESC")
    List<Object[]> findTopBranchesByStore(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.cashier.id = :cashierId AND o.createdAt BETWEEN :start AND :end ORDER BY o.createdAt")
    List<Order> findByCashierAndDateRange(@Param("cashierId") Long cashierId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.branch.id = :branchId AND o.createdAt BETWEEN :start AND :end AND o.orderStatus = 'CANCELLED'")
    Long countCancelledOrdersByBranchAndDateRange(@Param("branchId") Long branchId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.store.id = :storeId AND o.createdAt BETWEEN :start AND :end AND o.orderStatus = 'CANCELLED'")
    Long countCancelledOrdersByStoreAndDateRange(@Param("storeId") Long storeId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}