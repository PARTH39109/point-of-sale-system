package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByBranchId(Long branchId);
    Optional<Category> findByIdAndBranchId(Long id, Long branchId);

    // Admin — all categories across every branch of the store, or filtered to one branch
    List<Category> findByStoreId(Long storeId);
    List<Category> findByStoreIdAndBranchId(Long storeId, Long branchId);
    Optional<Category> findByIdAndStoreId(Long id, Long storeId);
}