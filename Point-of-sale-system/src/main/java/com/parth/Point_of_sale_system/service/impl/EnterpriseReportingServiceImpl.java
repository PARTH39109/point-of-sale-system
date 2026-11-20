package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.EnterpriseReportingService;
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
public class EnterpriseReportingServiceImpl implements EnterpriseReportingService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final InventoryRepository inventoryRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;

    @Override
    public List<Map<String, Object>> generateSalesReport(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);
        LocalDateTime[] window = rangeWindow(range);
        List<Object[]> rows = orderRepository.findDailyRevenueByStore(storeId, window[0], window[1]);
        return buildList(rows, "Date", "Revenue", "Orders_Count");
    }

    @Override
    public List<Map<String, Object>> generateBranchReport(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);
        LocalDateTime[] window = rangeWindow(range);
        List<Object[]> rows = orderRepository.findRevenuePerBranch(storeId, window[0], window[1]);
        return buildList(rows, "Branch_Name", "Total_Revenue", "Total_Orders");
    }

    @Override
    public List<Map<String, Object>> generateProductReport(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);
        LocalDateTime[] window = rangeWindow(range);
        // Using top 100 for report
        List<Object[]> rows = orderRepository.findTopProductsByStore(storeId, window[0], window[1], PageRequest.of(0, 100));
        return buildList(rows, "Product_Name", "Units_Sold", "Total_Revenue");
    }

    @Override
    public List<Map<String, Object>> generateInventoryReport(User user) throws Exception {
        Long storeId = resolveStoreId(user);
        // Simplification for the report - would ideally fetch Inventory entities mapped
        List<Map<String, Object>> res = new ArrayList<>();
        Map<String, Object> dummy = new HashMap<>();
        dummy.put("Status", "Inventory export requires direct product/inventory join");
        res.add(dummy);
        return res;
    }

    @Override
    public List<Map<String, Object>> generateRefundReport(User user, String range) throws Exception {
        return new ArrayList<>(); // To be implemented with RefundRepository
    }

    @Override
    public List<Map<String, Object>> generatePaymentReport(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);
        LocalDateTime[] window = rangeWindow(range);
        List<Object[]> rows = orderRepository.findPaymentMethodBreakdownByStore(storeId, window[0], window[1]);
        return buildList(rows, "Payment_Method", "Transaction_Count", "Total_Volume");
    }

    @Override
    public List<Map<String, Object>> generateEmployeeReport(User user) throws Exception {
        Long storeId = resolveStoreId(user);
        List<Map<String, Object>> res = new ArrayList<>();
        employeeRepository.findByStoreId(storeId).forEach(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("Employee_Name", e.getUser().getFullName());
            map.put("Email", e.getUser().getEmail());
            map.put("Role", e.getUser().getRole().name());
            map.put("Branch", e.getBranch() != null ? e.getBranch().getName() : "Unassigned");
            map.put("Status", e.getIsActive() ? "Active" : "Inactive");
            res.add(map);
        });
        return res;
    }

    @Override
    public List<Map<String, Object>> generateCustomerReport(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);
        List<Map<String, Object>> res = new ArrayList<>();
        customerRepository.findByStoreId(storeId).forEach(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("Customer_Name", c.getName());
            map.put("Email", c.getEmail());
            map.put("Phone", c.getPhone());
            map.put("Loyalty_Points", c.getLoyaltyPoints());
            res.add(map);
        });
        return res;
    }

    @Override
    public List<Map<String, Object>> generateCategoryReport(User user, String range) throws Exception {
        Long storeId = resolveStoreId(user);
        LocalDateTime[] window = rangeWindow(range);
        List<Object[]> rows = orderRepository.findRevenuePerCategory(storeId, window[0], window[1]);
        return buildList(rows, "Category_Name", "Revenue", "Units_Sold");
    }

    private Long resolveStoreId(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_ADMIN) throw new Exception("Super admin requires storeId parameter");
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) throw new Exception("Store Admin is not assigned to any store");
            return store.getId();
        }
        return user.getStore().getId();
    }

    private LocalDateTime[] rangeWindow(String range) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
        if (range == null) return new LocalDateTime[]{monthStart, now};
        return switch (range.toLowerCase()) {
            case "today" -> new LocalDateTime[]{now.toLocalDate().atStartOfDay(), now};
            case "week" -> new LocalDateTime[]{now.minusDays(6).toLocalDate().atStartOfDay(), now};
            case "year" -> new LocalDateTime[]{now.withDayOfYear(1).toLocalDate().atStartOfDay(), now};
            default -> new LocalDateTime[]{monthStart, now};
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
}
