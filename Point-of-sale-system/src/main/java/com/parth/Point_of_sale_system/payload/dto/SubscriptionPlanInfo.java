package com.parth.Point_of_sale_system.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanInfo {
    private Long id;
    private String type;
    private String name;
    private Double price;
    private Integer durationMonths;
    private Integer maxBranches;
    private Integer maxEmployees;
    private Integer maxProducts;
    private Integer maxMonthlyOrders;
    private Boolean isUnlimited;
}