package com.parth.Point_of_sale_system.repository;

import com.parth.Point_of_sale_system.modal.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // ── Basic finders ────────────────────────────────────────────────────────

    List<Product> findByStoreId(Long storeId);
    List<Product> findByBranchId(Long branchId);
    Long countByStoreId(Long storeId);
    Long countByBranchId(Long branchId);
    Long countByCategoryId(Long categoryId);

    // ── Composite-unique duplicate checks ────────────────────────────────────
    // Used by the service layer to produce a friendly error before the DB
    // constraint fires. Checks are scoped to (branch_id, sku/barcode) so the
    // same value is fine in a different branch.

    /**
     * Returns the product in this branch with the given SKU, if any.
     * On CREATE pass excludeId = null (or use the create-specific overload).
     * On UPDATE pass the id of the product being edited so it doesn't
     * conflict with itself.
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.branch.id = :branchId
              AND p.sku        = :sku
              AND (:excludeId IS NULL OR p.id <> :excludeId)
            """)
    Optional<Product> findByBranchIdAndSkuExcluding(
            @Param("branchId")  Long branchId,
            @Param("sku")       String sku,
            @Param("excludeId") Long excludeId);

    /**
     * Returns the product in this branch with the given barcode, if any.
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.branch.id = :branchId
              AND p.barcode    = :barcode
              AND (:excludeId IS NULL OR p.id <> :excludeId)
            """)
    Optional<Product> findByBranchIdAndBarcodeExcluding(
            @Param("branchId")  Long branchId,
            @Param("barcode")   String barcode,
            @Param("excludeId") Long excludeId);

    // ── Keyword search — store-scoped (used by Store Admin / Super Admin) ────

    @Query("""
            SELECT p FROM Product p
            WHERE p.store.id = :storeId
              AND (LOWER(p.name)    LIKE LOWER(CONCAT('%', :query, '%'))
               OR  LOWER(p.sku)     LIKE LOWER(CONCAT('%', :query, '%'))
               OR  LOWER(p.barcode) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    List<Product> searchByKeyword(
            @Param("storeId") Long storeId,
            @Param("query")   String keyword);

    // ── Keyword search — branch-scoped (used by Branch Managers) ────────────

    @Query("""
            SELECT p FROM Product p
            WHERE p.branch.id = :branchId
              AND (LOWER(p.name)    LIKE LOWER(CONCAT('%', :query, '%'))
               OR  LOWER(p.sku)     LIKE LOWER(CONCAT('%', :query, '%'))
               OR  LOWER(p.barcode) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    List<Product> searchByBranchAndKeyword(
            @Param("branchId") Long branchId,
            @Param("query")    String keyword);
}