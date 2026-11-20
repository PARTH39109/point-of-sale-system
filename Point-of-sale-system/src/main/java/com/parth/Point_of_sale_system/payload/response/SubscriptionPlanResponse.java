package com.parth.Point_of_sale_system.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlanResponse {
    private String planName;
    private Double price;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer daysRemaining;

    // New — additive, existing consumers of the fields above are unaffected
    private String subscriptionType;
    private Boolean isUnlimited;
    private LocalDateTime renewalDate;
    private Boolean autoRenew;
}