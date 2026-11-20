package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByStoreId(Long storeId);
    List<Employee> findByBranchId(Long branchId);
    Optional<Employee> findByUserId(Long userId);
    Optional<Employee> findByIdAndStoreId(Long id, Long storeId);
    long countByBranchIdAndIsActiveTrue(Long branchId);
    long countByStoreId(Long storeId);

    // Staff-only (no login account) — used by the redesigned Employee module
    List<Employee> findByStoreIdAndUserIsNull(Long storeId);
    List<Employee> findByBranchIdAndUserIsNull(Long branchId);
    Optional<Employee> findByIdAndBranchIdAndUserIsNull(Long id, Long branchId);
    Optional<Employee> findByIdAndStoreIdAndUserIsNull(Long id, Long storeId);

    // Cashier-only
    List<Employee> findByStoreIdAndUserRole(Long storeId, UserRole role);
    List<Employee> findByBranchIdAndUserRole(Long branchId, UserRole role);
    Optional<Employee> findByIdAndBranchIdAndUserRole(Long id, Long branchId, UserRole role);
    Optional<Employee> findByIdAndStoreIdAndUserRole(Long id, Long storeId, UserRole role);

    @Query("SELECT COUNT(e) > 0 FROM Employee e " +
            "WHERE e.branch.id = :branchId " +
            "AND e.user.role = com.parth.Point_of_sale_system.domain.UserRole.ROLE_BRANCH_MANAGER " +
            "AND e.isActive = true")
    boolean existsActiveBranchManager(@Param("branchId") Long branchId);
}