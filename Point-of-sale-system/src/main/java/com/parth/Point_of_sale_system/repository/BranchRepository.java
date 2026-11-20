package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByStoreId(Long storeId);
    List<Branch> findByStoreIdAndIsActive(Long storeId, Boolean isActive);
    Optional<Branch> findByIdAndStoreId(Long id, Long storeId);
    Long countByStoreId(Long storeId);
}
