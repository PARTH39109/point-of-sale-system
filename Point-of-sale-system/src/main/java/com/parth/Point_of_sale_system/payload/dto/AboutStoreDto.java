package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AboutStoreDto {
    private Long storeId;
    private String storeName;
    private String storeOwner;
    private String ownerEmail;
    private String subscriptionPlan;
    private LocalDateTime subscriptionExpiry;
    private Integer daysRemaining;
    private Long numberOfBranches;
    private Long numberOfEmployees;
    private Long numberOfProducts;
    private String databaseStatus;
    private String apiVersion;
    private String applicationVersion;
    private LocalDateTime createdOn;
    private LocalDateTime lastUpdated;
}
