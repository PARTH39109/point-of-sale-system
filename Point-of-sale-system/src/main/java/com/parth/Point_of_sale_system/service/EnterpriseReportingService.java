package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import java.util.List;
import java.util.Map;

public interface EnterpriseReportingService {
    List<Map<String, Object>> generateSalesReport(User user, String range) throws Exception;
    List<Map<String, Object>> generateBranchReport(User user, String range) throws Exception;
    List<Map<String, Object>> generateProductReport(User user, String range) throws Exception;
    List<Map<String, Object>> generateInventoryReport(User user) throws Exception;
    List<Map<String, Object>> generateRefundReport(User user, String range) throws Exception;
    List<Map<String, Object>> generatePaymentReport(User user, String range) throws Exception;
    List<Map<String, Object>> generateEmployeeReport(User user) throws Exception;
    List<Map<String, Object>> generateCustomerReport(User user, String range) throws Exception;
    List<Map<String, Object>> generateCategoryReport(User user, String range) throws Exception;
}
