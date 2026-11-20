package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.Order;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BranchAnalyticsResponse;
import com.parth.Point_of_sale_system.payload.response.BranchAnalyticsResponse.RecentOrderSummary;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.InventoryRepository;
import com.parth.Point_of_sale_system.repository.OrderRepository;
import com.parth.Point_of_sale_system.repository.RefundRepository;
import com.parth.Point_of_sale_system.service.BranchAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchAnalyticsServiceImpl implements BranchAnalyticsService {

    private final OrderRepository    orderRepository;
    private final InventoryRepository inventoryRepository;
    private final EmployeeRepository  employeeRepository;
    private final RefundRepository    refundRepository;

    // ── Entry Point ───────────────────────────────────────────────────────────
    @Override
    public BranchAnalyticsResponse getDashboardAnalytics(User user, String range) throws Exception {
        Long branchId = resolveBranchId(user);

        LocalDateTime now   = LocalDateTime.now();
        LocalDateTime todayStart  = now.toLocalDate().atStartOfDay();
        LocalDateTime weekStart   = now.minusDays(6).toLocalDate().atStartOfDay();
        LocalDateTime monthStart  = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        // ── KPI: Revenue ──────────────────────────────────────────────────────
        Double todaySales   = safe(orderRepository.sumRevenueByBranchAndDateRange(branchId, todayStart, now));
        Double weeklySales  = safe(orderRepository.sumRevenueByBranchAndDateRange(branchId, weekStart,  now));
        Double monthlySales = safe(orderRepository.sumRevenueByBranchAndDateRange(branchId, monthStart, now));

        // ── KPI: Order Counts ─────────────────────────────────────────────────
        Long ordersToday = safeL(orderRepository.countOrdersByBranchAndDateRange(branchId, todayStart, now));
        Long ordersWeek  = safeL(orderRepository.countOrdersByBranchAndDateRange(branchId, weekStart,  now));
        Long ordersMonth = safeL(orderRepository.countOrdersByBranchAndDateRange(branchId, monthStart, now));

        // ── KPI: Avg Order Value (selected range) ─────────────────────────────
        LocalDateTime[] rangeWindow = rangeWindow(range, now, todayStart, weekStart, monthStart);
        Double avgOrderValue = safe(orderRepository.avgOrderValueByBranchAndDateRange(
                branchId, rangeWindow[0], rangeWindow[1]));

        // ── KPI: Unique customers served this period ──────────────────────────
        Long totalCustomers = safeL(orderRepository.countUniqueCustomersByBranchAndDateRange(
                branchId, rangeWindow[0], rangeWindow[1]));

        // ── KPI: Active Employees ─────────────────────────────────────────────
        long activeEmployees = employeeRepository.countByBranchIdAndIsActiveTrue(branchId);

        // ── KPI: Stock Alerts ─────────────────────────────────────────────────
        Long lowStockProducts  = safeL(inventoryRepository.countLowStockByBranchId(branchId));
        Long outOfStockProducts= safeL(inventoryRepository.countOutOfStockByBranchId(branchId));

        // ── KPI: Pending Refunds ──────────────────────────────────────────────
        Long pendingRefunds = safeL(refundRepository.countPendingRefundsByBranch(branchId));

        // ── Chart: Daily Revenue (last 30 days) ───────────────────────────────
        LocalDateTime chartStart = now.minusDays(29).toLocalDate().atStartOfDay();
        List<Object[]> rawDaily  = orderRepository.findDailyRevenueByBranch(branchId, chartStart, now);
        List<Map<String, Object>> dailyRevenue = buildDailyRevenue(rawDaily);

        // ── Chart: Payment Method Breakdown ───────────────────────────────────
        List<Object[]> rawPayment = orderRepository.findPaymentMethodBreakdownByBranch(
                branchId, rangeWindow[0], rangeWindow[1]);
        List<Map<String, Object>> paymentBreakdown = buildPaymentBreakdown(rawPayment);

        // ── Table: Top Products (top 10) ──────────────────────────────────────
        List<Object[]> rawProducts = orderRepository.findTopProductsByBranch(
                branchId, rangeWindow[0], rangeWindow[1], PageRequest.of(0, 10));
        List<Map<String, Object>> topProducts = buildTopProducts(rawProducts);

        // ── Table: Recent Orders ──────────────────────────────────────────────
        List<Order> recentOrderEntities = orderRepository.findTop10ByBranchIdOrderByCreatedAtDesc(branchId);
        List<RecentOrderSummary> recentOrders = buildRecentOrders(recentOrderEntities);

        return BranchAnalyticsResponse.builder()
                .todaySales(todaySales)
                .weeklySales(weeklySales)
                .monthlySales(monthlySales)
                .ordersToday(ordersToday)
                .ordersWeek(ordersWeek)
                .ordersMonth(ordersMonth)
                .avgOrderValue(avgOrderValue)
                .totalCustomers(totalCustomers)
                .activeEmployees(activeEmployees)
                .lowStockProducts(lowStockProducts)
                .outOfStockProducts(outOfStockProducts)
                .pendingRefunds(pendingRefunds)
                .dailyRevenue(dailyRevenue)
                .paymentBreakdown(paymentBreakdown)
                .topProducts(topProducts)
                .recentOrders(recentOrders)
                .build();
    }

    // ── Branch Resolution ─────────────────────────────────────────────────────
    private Long resolveBranchId(User user) throws Exception {
        // ADMIN / STORE_ADMIN can pass any branchId; here we resolve from employee profile
        if (user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            throw new Exception("Admin users should use store-level analytics, not branch analytics.");
        }
        Employee emp = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new Exception(
                        "Branch Manager '" + user.getEmail() + "' has no Employee record. " +
                        "Please ensure the manager was registered as an Employee with a Branch assignment."));
        if (emp.getBranch() == null) {
            throw new Exception("Employee '" + user.getEmail() + "' is not assigned to any branch. " +
                    "Please assign this manager to a branch in the admin panel.");
        }
        return emp.getBranch().getId();
    }

    // ── Range Window ──────────────────────────────────────────────────────────
    private LocalDateTime[] rangeWindow(String range, LocalDateTime now,
                                        LocalDateTime todayStart,
                                        LocalDateTime weekStart,
                                        LocalDateTime monthStart) {
        return switch (range == null ? "week" : range.toLowerCase()) {
            case "today"  -> new LocalDateTime[]{todayStart, now};
            case "month"  -> new LocalDateTime[]{monthStart, now};
            default       -> new LocalDateTime[]{weekStart,  now}; // "week"
        };
    }

    // ── Builder Helpers ───────────────────────────────────────────────────────
    private List<Map<String, Object>> buildDailyRevenue(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            // row[0] = java.sql.Date or LocalDate
            Object dateObj = row[0];
            String dateStr = dateObj == null ? "" : dateObj.toString();
            entry.put("date",    dateStr);
            entry.put("revenue", row[1] == null ? 0.0 : ((Number) row[1]).doubleValue());
            entry.put("orders",  row[2] == null ? 0L   : ((Number) row[2]).longValue());
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> buildPaymentBreakdown(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("method", row[0] == null ? "UNKNOWN" : row[0].toString());
            entry.put("count",  row[1] == null ? 0L   : ((Number) row[1]).longValue());
            entry.put("total",  row[2] == null ? 0.0  : ((Number) row[2]).doubleValue());
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> buildTopProducts(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("productName", row[0] == null ? "Unknown" : row[0].toString());
            entry.put("unitsSold",   row[1] == null ? 0L   : ((Number) row[1]).longValue());
            entry.put("revenue",     row[2] == null ? 0.0  : ((Number) row[2]).doubleValue());
            result.add(entry);
        }
        return result;
    }

    private List<RecentOrderSummary> buildRecentOrders(List<Order> orders) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<RecentOrderSummary> result = new ArrayList<>();
        for (Order o : orders) {
            result.add(RecentOrderSummary.builder()
                    .id(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .customerName(o.getCustomer() != null ? o.getCustomer().getName() : "Walk-in")
                    .grandTotal(o.getGrandTotal())
                    .orderStatus(o.getOrderStatus() != null ? o.getOrderStatus().name() : "")
                    .paymentStatus(o.getPaymentStatus() != null ? o.getPaymentStatus().name() : "")
                    .paymentMethod(o.getPaymentMethod())
                    .createdAt(o.getCreatedAt() != null ? o.getCreatedAt().format(fmt) : "")
                    .build());
        }
        return result;
    }

    // ── Null-safe helpers ─────────────────────────────────────────────────────
    private Double safe(Double v) { return v == null ? 0.0 : v; }
    private Long   safeL(Long v)  { return v == null ? 0L  : v; }
}
