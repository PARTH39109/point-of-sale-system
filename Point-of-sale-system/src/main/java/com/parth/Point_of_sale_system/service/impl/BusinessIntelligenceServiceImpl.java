package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BusinessIntelligenceResponse;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.BusinessIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessIntelligenceServiceImpl implements BusinessIntelligenceService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    @Override
    public BusinessIntelligenceResponse getDashboardAnalytics(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);

        // A new Store Admin with no store yet is a valid state — return empty data, not an error.
        if (storeId == null) {
            return BusinessIntelligenceResponse.empty();
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime yesterdayStart = todayStart.minusDays(1);
        LocalDateTime weekStart = todayStart.minusDays(6);
        LocalDateTime monthStart = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
        LocalDateTime yearStart = now.withDayOfYear(1).toLocalDate().atStartOfDay();

        LocalDateTime[] window = rangeWindow(range, now, todayStart, weekStart, monthStart, yearStart);

        // Revenue
        Double todayRevenue = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, todayStart, now));
        Double yesterdayRevenue = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, yesterdayStart, todayStart));
        Double weeklyRevenue = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, weekStart, now));
        Double monthlyRevenue = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, monthStart, now));
        Double yearlyRevenue = safe(orderRepository.sumRevenueByStoreAndDateRange(storeId, yearStart, now));
        
        Double prevPeriodRev = yesterdayRevenue; 
        Double revenueGrowthPercent = prevPeriodRev > 0 ? ((todayRevenue - prevPeriodRev) / prevPeriodRev) * 100 : 0;
        
        Double avgOrderValue = safe(orderRepository.avgOrderValueByStoreAndDateRange(storeId, window[0], window[1]));

        // Sales
        Long ordersToday = safeL(orderRepository.countOrdersByStoreAndDateRange(storeId, todayStart, now));
        Long ordersThisWeek = safeL(orderRepository.countOrdersByStoreAndDateRange(storeId, weekStart, now));
        Long ordersThisMonth = safeL(orderRepository.countOrdersByStoreAndDateRange(storeId, monthStart, now));

        // Complex Data
        List<Map<String, Object>> revenueTrend = buildList(orderRepository.findDailyRevenueByStore(storeId, window[0], window[1]), "date", "revenue", "orders");
        List<Map<String, Object>> revenuePerBranch = buildList(orderRepository.findRevenuePerBranch(storeId, window[0], window[1]), "name", "revenue", "orders");
        List<Map<String, Object>> revenuePerCategory = buildList(orderRepository.findRevenuePerCategory(storeId, window[0], window[1]), "name", "revenue", "qty");
        List<Map<String, Object>> peakSalesHours = buildList(orderRepository.findPeakSalesHours(storeId, window[0], window[1]), "hour", "orders", "revenue");
        List<Map<String, Object>> peakSalesDays = buildList(orderRepository.findPeakSalesDays(storeId, window[0], window[1]), "day", "orders", "revenue");
        List<Map<String, Object>> topCashiers = buildList(orderRepository.findTopCashiers(storeId, window[0], window[1], PageRequest.of(0, 10)), "name", "orders", "revenue");
        List<Map<String, Object>> mostSoldProducts = buildList(orderRepository.findTopProductsByStore(storeId, window[0], window[1], PageRequest.of(0, 10)), "name", "qty", "revenue");
        
        // Payment breakdown
        List<Map<String, Object>> payments = buildList(orderRepository.findPaymentMethodBreakdownByStore(storeId, window[0], window[1]), "method", "count", "revenue");
        double totalRevForPayments = payments.stream().mapToDouble(m -> (Double) m.get("revenue")).sum();
        
        return BusinessIntelligenceResponse.builder()
                .todayRevenue(todayRevenue)
                .yesterdayRevenue(yesterdayRevenue)
                .weeklyRevenue(weeklyRevenue)
                .monthlyRevenue(monthlyRevenue)
                .yearlyRevenue(yearlyRevenue)
                .revenueGrowthPercent(revenueGrowthPercent)
                .averageOrderValue(avgOrderValue)
                .ordersToday(ordersToday)
                .ordersThisWeek(ordersThisWeek)
                .ordersThisMonth(ordersThisMonth)
                .completedOrders(ordersToday) // simplified
                .revenueTrend(revenueTrend)
                .revenuePerBranch(revenuePerBranch)
                .revenuePerCategory(revenuePerCategory)
                .peakSalesHours(peakSalesHours)
                .peakSalesDays(peakSalesDays)
                .topCashiers(topCashiers)
                .mostSoldProducts(mostSoldProducts)
                .cashPercent(calcPercent(payments, "CASH", totalRevForPayments))
                .cardPercent(calcPercent(payments, "CARD", totalRevForPayments))
                .upiPercent(calcPercent(payments, "UPI", totalRevForPayments))
                .walletPercent(calcPercent(payments, "WALLET", totalRevForPayments))
                .splitPercent(calcPercent(payments, "SPLIT", totalRevForPayments))
                .build();
    }

    private Double calcPercent(List<Map<String, Object>> list, String method, double total) {
        if (total == 0) return 0.0;
        double val = list.stream().filter(m -> method.equals(m.get("method"))).mapToDouble(m -> (Double)m.get("revenue")).sum();
        return (val / total) * 100;
    }

//    private Long resolveStoreId(User user) throws Exception {
//        if (user.getRole() == UserRole.ROLE_ADMIN) throw new Exception("Super admin requires storeId parameter");
//        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
//            Store store = storeRepository.findByStoreAdminId(user.getId());
//            if (store == null) throw new Exception("Store Admin is not assigned to any store");
//            return store.getId();
//        }
//        return user.getStore().getId();
//    }

    private Long resolveStoreId(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_ADMIN)
            throw new Exception("Super admin requires storeId parameter");

        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            // null means the Store Admin registered but has not yet created a store — valid state
            return store != null ? store.getId() : null;
        }
        return user.getStore() != null ? user.getStore().getId() : null;
    }

    private LocalDateTime[] rangeWindow(String range, LocalDateTime now, LocalDateTime today, LocalDateTime week, LocalDateTime month, LocalDateTime year) {
        if (range == null) return new LocalDateTime[]{month, now};
        return switch (range.toLowerCase()) {
            case "today" -> new LocalDateTime[]{today, now};
            case "week" -> new LocalDateTime[]{week, now};
            case "year" -> new LocalDateTime[]{year, now};
            default -> new LocalDateTime[]{month, now};
        };
    }

    private List<Map<String, Object>> buildList(List<Object[]> rows, String k1, String k2, String k3) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> map = new HashMap<>();
            map.put(k1, r[0]);
            map.put(k2, r[1] instanceof Number ? ((Number)r[1]).doubleValue() : r[1]);
            map.put(k3, r[2] instanceof Number ? ((Number)r[2]).doubleValue() : r[2]);
            res.add(map);
        }
        return res;
    }

    private Double safe(Double v) { return v == null ? 0.0 : v; }
    private Long safeL(Long v) { return v == null ? 0L : v; }
}
