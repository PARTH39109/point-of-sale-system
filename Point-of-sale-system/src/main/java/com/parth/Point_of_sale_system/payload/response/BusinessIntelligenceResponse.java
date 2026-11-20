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
public class BusinessIntelligenceResponse {

    // ── Revenue Analytics ──
    private Double todayRevenue;
    private Double yesterdayRevenue;
    private Double weeklyRevenue;
    private Double monthlyRevenue;
    private Double yearlyRevenue;
    private Double revenueGrowthPercent;
    private Double averageOrderValue;
    
    // ── Sales Analytics ──
    private Long ordersToday;
    private Long ordersThisWeek;
    private Long ordersThisMonth;
    private Long completedOrders;
    private Long cancelledOrders;
    private Long refundedOrders;

    // ── Inventory Analytics ──
    private Double inventoryValue;
    private Double stockTurnover;
    private Long lowStockItems;
    private Long outOfStockItems;

    // ── Customer Analytics ──
    private Long newCustomers;
    private Long returningCustomers;
    private Double repeatPurchaseRate;
    private Long loyaltyPointsDistributed;

    // ── Payment Analytics ──
    private Double cashPercent;
    private Double cardPercent;
    private Double upiPercent;
    private Double walletPercent;
    private Double splitPercent;

    // ── Deep Dive Distributions (Charts) ──
    private List<Map<String, Object>> revenueTrend;
    private List<Map<String, Object>> revenuePerBranch;
    private List<Map<String, Object>> revenuePerCategory;
    
    private List<Map<String, Object>> peakSalesHours;
    private List<Map<String, Object>> peakSalesDays;

    private List<Map<String, Object>> mostSoldProducts;
    private List<Map<String, Object>> leastSoldProducts;
    
    private List<Map<String, Object>> topCustomers;
    private List<Map<String, Object>> customerGrowthTrend;

    private List<Map<String, Object>> topCashiers;

    private List<Map<String, Object>> branchRanking;

    /**
     * Returns a safe, all-zero response for a new store that has no data yet.
     * Used when a Store Admin exists but has not created any branches, orders, or products.
     */
    public static BusinessIntelligenceResponse empty() {
        return BusinessIntelligenceResponse.builder()
                .todayRevenue(0.0)
                .yesterdayRevenue(0.0)
                .weeklyRevenue(0.0)
                .monthlyRevenue(0.0)
                .yearlyRevenue(0.0)
                .revenueGrowthPercent(0.0)
                .averageOrderValue(0.0)
                .ordersToday(0L)
                .ordersThisWeek(0L)
                .ordersThisMonth(0L)
                .completedOrders(0L)
                .cancelledOrders(0L)
                .refundedOrders(0L)
                .inventoryValue(0.0)
                .stockTurnover(0.0)
                .lowStockItems(0L)
                .outOfStockItems(0L)
                .newCustomers(0L)
                .returningCustomers(0L)
                .repeatPurchaseRate(0.0)
                .loyaltyPointsDistributed(0L)
                .cashPercent(0.0)
                .cardPercent(0.0)
                .upiPercent(0.0)
                .walletPercent(0.0)
                .splitPercent(0.0)
                .revenueTrend(java.util.Collections.emptyList())
                .revenuePerBranch(java.util.Collections.emptyList())
                .revenuePerCategory(java.util.Collections.emptyList())
                .peakSalesHours(java.util.Collections.emptyList())
                .peakSalesDays(java.util.Collections.emptyList())
                .mostSoldProducts(java.util.Collections.emptyList())
                .leastSoldProducts(java.util.Collections.emptyList())
                .topCustomers(java.util.Collections.emptyList())
                .customerGrowthTrend(java.util.Collections.emptyList())
                .topCashiers(java.util.Collections.emptyList())
                .branchRanking(java.util.Collections.emptyList())
                .build();
    }
}
