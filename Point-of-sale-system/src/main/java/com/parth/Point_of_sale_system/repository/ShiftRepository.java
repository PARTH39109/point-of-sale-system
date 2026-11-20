package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.domain.ShiftStatus;
import com.parth.Point_of_sale_system.modal.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    Optional<Shift> findByCashierIdAndStatus(Long cashierId, ShiftStatus status);
    List<Shift> findByCashierIdOrderByOpenedAtDesc(Long cashierId);
    List<Shift> findByCashierIdAndOpenedAtBetweenOrderByOpenedAtDesc(Long cashierId, LocalDateTime start, LocalDateTime end);
    List<Shift> findByBranchIdAndOpenedAtBetweenOrderByOpenedAtDesc(Long branchId, LocalDateTime start, LocalDateTime end);
    List<Shift> findByStoreIdAndOpenedAtBetweenOrderByOpenedAtDesc(Long storeId, LocalDateTime start, LocalDateTime end);
    long countByBranchIdAndStatus(Long branchId, ShiftStatus status);
    long countByStoreIdAndStatus(Long storeId, ShiftStatus status);
    Optional<Shift> findByIdAndBranchId(Long id, Long branchId);
    Optional<Shift> findByIdAndCashierId(Long id, Long cashierId);
    Optional<Shift> findByIdAndStoreId(Long id, Long storeId);
}