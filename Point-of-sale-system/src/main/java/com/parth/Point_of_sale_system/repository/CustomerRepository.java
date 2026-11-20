package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByStoreId(Long storeId);

    @Query(
            "SELECT c FROM Customer c " +
                    "WHERE c.store.id = :storeId AND " +
                    "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :query, '%')))"
    )
    List<Customer> searchByKeyword(@Param("storeId") Long storeId,
                                   @Param("query") String keyword);
    long countByStoreId(Long storeId);

    List<Customer> findByBranchId(Long branchId);

    @Query(
            "SELECT c FROM Customer c " +
                    "WHERE c.branch.id = :branchId AND " +
                    "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
                    "OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :query, '%')))"
    )
    List<Customer> searchByBranchAndKeyword(@Param("branchId") Long branchId,
                                            @Param("query") String keyword);
}