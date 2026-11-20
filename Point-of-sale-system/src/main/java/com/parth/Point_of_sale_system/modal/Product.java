package com.parth.Point_of_sale_system.modal;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(
        // Drop global unique constraints on sku and barcode.
        // Enforce uniqueness only within the same branch:
        //   (branch_id, sku)     — same SKU is allowed across different branches
        //   (branch_id, barcode) — same barcode is allowed across different branches
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_branch_sku",     columnNames = {"branch_id", "sku"}),
                @UniqueConstraint(name = "uq_branch_barcode", columnNames = {"branch_id", "barcode"})
        }
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private String name;

    // NOT unique globally — uniqueness is enforced at (branch_id, sku) level via @Table above
    @Column(nullable = false)
    private String sku;

    // NOT unique globally — uniqueness is enforced at (branch_id, barcode) level via @Table above
    private String barcode;

    private String description;

    private Double price;

    private Double mrp;

    private Double sellingPrice;
    private String brand;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String image;

    @Column(nullable = false)
    @Builder.Default
    private String unit = "pcs";   // e.g. pcs, kg, g, ltr, ml, box, dozen, pack

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_id")
    private Store store;

    // branch_id is the scoping key — all uniqueness is relative to this column
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    private Double taxRate;     // e.g. 18.0 for 18% GST

    @Column(nullable = false)
    private Boolean isActive = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreated() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (unit == null || unit.isBlank()) unit = "pcs";
    }

    @PreUpdate
    protected void onUpdated() {
        updatedAt = LocalDateTime.now();
    }
}