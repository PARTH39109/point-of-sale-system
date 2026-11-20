package com.parth.Point_of_sale_system.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnterpriseAnalyticsResponse {
    
    // KPI Cards
    private Double totalRevenue;
    private Double todayRevenue;
    private Double weeklyRevenue;
    private Double monthlyRevenue;
    private Long totalOrders;
    private Double avgOrderValue;
    private Long totalCustomers;
    private Long totalEmployees;
    private Long totalProducts;
    private Long activeBranches;
    private Long activeStores;
    private Double totalRefundAmount;

    // Charts & Tables
    private List<Map<String, Object>> dailyRevenue;       // Revenue Trend
    private List<Map<String, Object>> paymentBreakdown;   // Payment Distribution
    private List<Map<String, Object>> topProducts;        // Top Selling Products
    private List<Map<String, Object>> topBranches;        // Top Performing Branches
    private List<Map<String, Object>> topEmployees;       // Top Performing Employees
    
    // Tables
    private List<BranchAnalyticsResponse.RecentOrderSummary> recentOrders;
    private List<Map<String, Object>> recentRefunds;
    private List<Map<String, Object>> lowStockAcrossBranches;
    private List<Map<String, Object>> recentEmployees;

    /**
     * Returns a safe, all-zero response for a new store that has no data yet.
     * Used when a Store Admin exists but has not created any branches or processed any orders.
     */
    public static EnterpriseAnalyticsResponse empty() {
        return EnterpriseAnalyticsResponse.builder()
                .totalRevenue(0.0)
                .todayRevenue(0.0)
                .weeklyRevenue(0.0)
                .monthlyRevenue(0.0)
                .totalOrders(0L)
                .avgOrderValue(0.0)
                .totalCustomers(0L)
                .totalEmployees(0L)
                .totalProducts(0L)
                .activeBranches(0L)
                .activeStores(1L)
                .totalRefundAmount(0.0)
                .dailyRevenue(java.util.Collections.emptyList())
                .paymentBreakdown(java.util.Collections.emptyList())
                .topProducts(java.util.Collections.emptyList())
                .topBranches(java.util.Collections.emptyList())
                .topEmployees(java.util.Collections.emptyList())
                .recentOrders(java.util.Collections.emptyList())
                .recentRefunds(java.util.Collections.emptyList())
                .lowStockAcrossBranches(java.util.Collections.emptyList())
                .recentEmployees(java.util.Collections.emptyList())
                .build();
    }
}
