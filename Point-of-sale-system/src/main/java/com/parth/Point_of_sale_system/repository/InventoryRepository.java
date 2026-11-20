package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByBranchId(Long branchId);
    Optional<Inventory> findByProductIdAndBranchId(Long productId, Long branchId);

    // Returns ALL items at or below min stock level, including zero (out-of-stock).
    // COALESCE guards against rows where minStockLevel was never set (NULL),
    // which would otherwise silently fail the `<=` comparison and drop the
    // item from every alert list even though it's genuinely low/out of stock.
    @Query("SELECT i FROM Inventory i LEFT JOIN FETCH i.product WHERE i.branch.id = :branchId AND i.quantity <= COALESCE(i.minStockLevel, 10)")
    List<Inventory> findLowStockByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT i FROM Inventory i WHERE i.branch.id = :branchId AND i.quantity = 0")
    List<Inventory> findOutOfStockByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT i FROM Inventory i WHERE i.branch.store.id = :storeId")
    List<Inventory> findByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT i FROM Inventory i WHERE i.branch.store.id = :storeId AND i.quantity <= COALESCE(i.minStockLevel, 10)")
    List<Inventory> findLowStockByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.branch.id = :branchId AND i.quantity <= COALESCE(i.minStockLevel, 10) AND i.quantity > 0")
    Long countLowStockByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.branch.id = :branchId AND i.quantity = 0")
    Long countOutOfStockByBranchId(@Param("branchId") Long branchId);
}