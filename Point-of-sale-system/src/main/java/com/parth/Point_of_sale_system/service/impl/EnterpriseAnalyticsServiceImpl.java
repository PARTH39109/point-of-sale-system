package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Order;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BranchAnalyticsResponse.RecentOrderSummary;
import com.parth.Point_of_sale_system.payload.response.EnterpriseAnalyticsResponse;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.EnterpriseAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnterpriseAnalyticsServiceImpl implements EnterpriseAnalyticsService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Override
    public EnterpriseAnalyticsResponse getEnterpriseDashboardAnalytics(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);

        // A new Store Admin with no store yet is a valid state — return empty data, not an error.
        if (storeId == null) {
            return EnterpriseAnalyticsResponse.empty();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime weekStart = now.minusDays(6).toLocalDate().atStartOfDay();
        LocalDateTime monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        LocalDateTime[] rangeWindow = rangeWindow(range, now, todayStart, weekStart, monthStart);

        // ── KPIs ────────────────────────────────────────────────────────────
        Double totalRevenue   = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, LocalDateTime.MIN, now));
        Double todayRevenue   = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, todayStart, now));
        Double weeklyRevenue  = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, weekStart, now));
        Double monthlyRevenue = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, monthStart, now));

        Long totalOrders      = safeL(orderRepository.countOrdersByStoreAndDateRange(storeId, rangeWindow[0], rangeWindow[1]));
        Double avgOrderValue  = safe(orderRepository.avgOrderValueByStoreAndDateRange(storeId, rangeWindow[0], rangeWindow[1]));
        Long totalCustomers   = safeL(orderRepository.countUniqueCustomersByStoreAndDateRange(storeId, LocalDateTime.MIN, now));
        
        long activeStores     = 1L; // Assuming store admin is scoped to 1 store
        long activeBranches   = branchRepository.countByStoreId(storeId);
        long totalEmployees   = employeeRepository.findByStoreId(storeId).size();
        long totalProducts    = productRepository.countByStoreId(storeId);
        Double totalRefundAmount = 0.0; // Simplification for now, can be queried from RefundRepository

        // ── Charts & Tables ──────────────────────────────────────────────────
        List<Object[]> rawDaily = orderRepository.findDailyRevenueByStore(storeId, now.minusDays(29).toLocalDate().atStartOfDay(), now);
        List<Map<String, Object>> dailyRevenue = buildDailyRevenue(rawDaily);

        List<Object[]> rawPayment = orderRepository.findPaymentMethodBreakdownByStore(storeId, rangeWindow[0], rangeWindow[1]);
        List<Map<String, Object>> paymentBreakdown = buildPaymentBreakdown(rawPayment);

        List<Object[]> rawProducts = orderRepository.findTopProductsByStore(storeId, rangeWindow[0], rangeWindow[1], PageRequest.of(0, 10));
        List<Map<String, Object>> topProducts = buildTopProducts(rawProducts);

        List<Object[]> rawBranches = orderRepository.findTopBranchesByStore(storeId, rangeWindow[0], rangeWindow[1], PageRequest.of(0, 5));
        List<Map<String, Object>> topBranches = buildTopBranches(rawBranches);

        List<Order> recentOrderEntities = orderRepository.findTop10ByStoreIdOrderByCreatedAtDesc(storeId);
        List<RecentOrderSummary> recentOrders = buildRecentOrders(recentOrderEntities);

        // Dummy data for missing complex queries
        List<Map<String, Object>> topEmployees = new ArrayList<>();
        List<Map<String, Object>> recentRefunds = new ArrayList<>();
        List<Map<String, Object>> lowStockAcrossBranches = new ArrayList<>();
        List<Map<String, Object>> recentEmployees = new ArrayList<>();

        return EnterpriseAnalyticsResponse.builder()
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .weeklyRevenue(weeklyRevenue)
                .monthlyRevenue(monthlyRevenue)
                .totalOrders(totalOrders)
                .avgOrderValue(avgOrderValue)
                .totalCustomers(totalCustomers)
                .totalEmployees(totalEmployees)
                .totalProducts(totalProducts)
                .activeBranches(activeBranches)
                .activeStores(activeStores)
                .totalRefundAmount(totalRefundAmount)
                .dailyRevenue(dailyRevenue)
                .paymentBreakdown(paymentBreakdown)
                .topProducts(topProducts)
                .topBranches(topBranches)
                .topEmployees(topEmployees)
                .recentOrders(recentOrders)
                .recentRefunds(recentRefunds)
                .lowStockAcrossBranches(lowStockAcrossBranches)
                .recentEmployees(recentEmployees)
                .build();
    }

    private Long resolveStoreId(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_ADMIN) {
            throw new Exception("Super admin requires storeId parameter");
        }
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            // null means the Store Admin registered but has not yet created a store — valid state
            return store != null ? store.getId() : null;
        }
        return user.getStore() != null ? user.getStore().getId() : null;
    }

    private LocalDateTime[] rangeWindow(String range, LocalDateTime now, LocalDateTime todayStart, LocalDateTime weekStart, LocalDateTime monthStart) {
        return switch (range == null ? "month" : range.toLowerCase()) {
            case "today" -> new LocalDateTime[]{todayStart, now};
            case "week" -> new LocalDateTime[]{weekStart, now};
            default -> new LocalDateTime[]{monthStart, now};
        };
    }

    private List<Map<String, Object>> buildDailyRevenue(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", row[0] == null ? "" : row[0].toString());
            entry.put("revenue", row[1] == null ? 0.0 : ((Number) row[1]).doubleValue());
            entry.put("orders", row[2] == null ? 0L : ((Number) row[2]).longValue());
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> buildPaymentBreakdown(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("method", row[0] == null ? "UNKNOWN" : row[0].toString());
            entry.put("count", row[1] == null ? 0L : ((Number) row[1]).longValue());
            entry.put("total", row[2] == null ? 0.0 : ((Number) row[2]).doubleValue());
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> buildTopProducts(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("productName", row[0] == null ? "Unknown" : row[0].toString());
            entry.put("unitsSold", row[1] == null ? 0L : ((Number) row[1]).longValue());
            entry.put("revenue", row[2] == null ? 0.0 : ((Number) row[2]).doubleValue());
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> buildTopBranches(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("branchName", row[0] == null ? "Unknown" : row[0].toString());
            entry.put("revenue", row[1] == null ? 0.0 : ((Number) row[1]).doubleValue());
            entry.put("orders", row[2] == null ? 0L : ((Number) row[2]).longValue());
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

    private Double safe(Double v) { return v == null ? 0.0 : v; }
    private Long safeL(Long v) { return v == null ? 0L : v; }
}
