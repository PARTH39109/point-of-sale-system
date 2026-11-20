package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.SubscriptionType;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.SubscriptionHistory;
import com.parth.Point_of_sale_system.payload.response.SubscriptionPlanInfo;
import com.parth.Point_of_sale_system.payload.response.SubscriptionPlanResponse;
import com.parth.Point_of_sale_system.payload.response.SubscriptionUsageResponse;

import java.util.List;

public interface SubscriptionService {
    void validateLimit(Long storeId, LimitType type);
    void assignDefaultSubscription(Store store);
    SubscriptionPlanResponse getMyPlan(Long storeId) throws Exception;
    SubscriptionUsageResponse getUsage(Long storeId) throws Exception;
    List<SubscriptionHistory> getHistory(Long storeId) throws Exception;
    List<SubscriptionPlanInfo> getAllPlans();
    void upgradePlan(Long storeId, SubscriptionType newType) throws Exception;
    void renewPlan(Long storeId) throws Exception;
}