package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.domain.AccessRequestStatus;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.ManagerAccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagerAccessRequestRepository extends JpaRepository<ManagerAccessRequest, Long> {

    // ── Store Admin scope (Branch Manager requests) ──
    List<ManagerAccessRequest> findByStoreIdAndRequestedRoleOrderByCreatedAtDesc(Long storeId, UserRole role);

    List<ManagerAccessRequest> findByStoreIdAndRequestedRoleAndStatusOrderByCreatedAtDesc(
            Long storeId, UserRole role, AccessRequestStatus status);

    Optional<ManagerAccessRequest> findByIdAndStoreIdAndRequestedRole(Long id, Long storeId, UserRole role);

    // ── Branch Manager scope (Cashier requests) ──
    List<ManagerAccessRequest> findByBranchIdAndRequestedRoleOrderByCreatedAtDesc(Long branchId, UserRole role);

    List<ManagerAccessRequest> findByBranchIdAndRequestedRoleAndStatusOrderByCreatedAtDesc(
            Long branchId, UserRole role, AccessRequestStatus status);

    Optional<ManagerAccessRequest> findByIdAndBranchIdAndRequestedRole(Long id, Long branchId, UserRole role);

    boolean existsByEmailAndStatus(String email, AccessRequestStatus status);

    boolean existsByPhoneAndStatus(String phone, AccessRequestStatus status);
}