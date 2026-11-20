package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BranchAnalyticsResponse;

public interface BranchAnalyticsService {

    /**
     * Returns full dashboard KPIs + recent orders + top products + chart data
     * for the branch associated with the given user.
     * Range: "today" | "week" | "month"
     */
    BranchAnalyticsResponse getDashboardAnalytics(User user, String range) throws Exception;
}
