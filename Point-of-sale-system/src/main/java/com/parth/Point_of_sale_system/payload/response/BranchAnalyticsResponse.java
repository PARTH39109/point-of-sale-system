package com.parth.Point_of_sale_system.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchAnalyticsResponse {

    // ── KPI Cards ──────────────────────────────────────────────────────────────
    private Double todaySales;
    private Double weeklySales;
    private Double monthlySales;
    private Long   ordersToday;
    private Long   ordersWeek;
    private Long   ordersMonth;
    private Double avgOrderValue;         // for the selected range
    private Long   totalCustomers;        // unique customers this period
    private Long   activeEmployees;       // employees at this branch
    private Long   lowStockProducts;
    private Long   outOfStockProducts;
    private Long   pendingRefunds;

    // ── Charts ─────────────────────────────────────────────────────────────────
    /** [{ date: "2026-07-01", revenue: 12000.0, orders: 8 }, ...] */
    private List<Map<String, Object>> dailyRevenue;

    /** [{ method: "CASH", count: 12, total: 45000.0 }, ...] */
    private List<Map<String, Object>> paymentBreakdown;

    // ── Tables ─────────────────────────────────────────────────────────────────
    /** [{ productName: "...", unitsSold: 34, revenue: 68000.0 }, ...] */
    private List<Map<String, Object>> topProducts;

    /** Recent 10 orders – compact view */
    private List<RecentOrderSummary> recentOrders;

    // ── Inner DTO ──────────────────────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentOrderSummary {
        private Long   id;
        private String orderNumber;
        private String customerName;
        private Double grandTotal;
        private String orderStatus;
        private String paymentStatus;
        private String paymentMethod;
        private String createdAt;
    }
}
