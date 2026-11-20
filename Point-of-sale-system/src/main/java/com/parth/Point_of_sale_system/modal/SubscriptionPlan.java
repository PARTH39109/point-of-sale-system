package com.parth.Point_of_sale_system.modal;

import com.parth.Point_of_sale_system.domain.SubscriptionType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private SubscriptionType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    @Builder.Default
    private Integer durationMonths = 12;

    // A null value on any of these means "unlimited" for that specific resource.
    private Integer maxBranches;
    private Integer maxEmployees;
    private Integer maxProducts;
    private Integer maxCustomers;      // intentionally left null on every plan — customers are never capped by this spec
    private Integer maxMonthlyOrders;

    // Master switch for the Advance plan — true bypasses every validation regardless of the fields above.
    @Column(nullable = false)
    @Builder.Default
    private Boolean isUnlimited = false;

    private Integer apiLimit;
    private Integer storageLimit;
}