package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.response.BusinessIntelligenceResponse;

public interface BusinessIntelligenceService {
    BusinessIntelligenceResponse getDashboardAnalytics(User user, String range) throws Exception;
}
