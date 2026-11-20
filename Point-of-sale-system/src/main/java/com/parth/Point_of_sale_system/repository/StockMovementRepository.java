package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByInventoryId(Long inventoryId);

    @Query("SELECT sm FROM StockMovement sm WHERE sm.inventory.branch.id = :branchId ORDER BY sm.createdAt DESC")
    List<StockMovement> findByBranchId(@Param("branchId") Long branchId);
}
