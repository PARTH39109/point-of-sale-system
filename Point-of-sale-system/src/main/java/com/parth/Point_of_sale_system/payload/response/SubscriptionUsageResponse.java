package com.parth.Point_of_sale_system.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionUsageResponse {
    private Integer maxBranches;
    private Long usedBranches;
    private Double branchUsagePercent;

    private Integer maxEmployees;
    private Long usedEmployees;
    private Double employeeUsagePercent;

    private Integer maxProducts;
    private Long usedProducts;
    private Double productUsagePercent;

    private Integer maxCustomers;
    private Long usedCustomers;
    private Double customerUsagePercent;
    
    private Integer maxMonthlyOrders;
    private Long usedMonthlyOrders;
    private Double orderUsagePercent;
}
