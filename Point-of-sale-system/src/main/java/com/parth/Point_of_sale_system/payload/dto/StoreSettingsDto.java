package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSettingsDto {
    private Long id;
    private Long storeId;

    // 1. Business Profile
    private String storeName;
    private String logoUrl;
    private String legalBusinessName;
    private String businessType;
    private String gstNumber;
    private String panNumber;
    private String registeredAddress;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String supportEmail;
    private String supportPhone;
    private String website;
    private String businessDescription;

    // 2. Branch Management Settings
    private Long defaultBranchId;
    private String branchCodePrefix;
    private Boolean autoGenerateBranchCode;
    private String defaultBranchStatus;
    private Integer maxEmployeesPerBranch;

    // 3. Payment Gateway (Razorpay)
    private String razorpayKeyId;
    private String razorpaySecretKey;
    private String razorpayWebhookSecret;
    private Boolean razorpayTestMode;
    private Boolean enableOnlinePayments;

    // 4. Tax & GST
    private Boolean enableGst;
    private String taxPricingType;
    private Double defaultGstRate;
    private Double cgstRate;
    private Double sgstRate;
    private Double igstRate;
    private String invoiceTaxNotes;

    // 5. Notifications - Email
    private Boolean notifyEmailNewEmployee;
    private Boolean notifyEmailNewBranch;
    private Boolean notifyEmailSubExpiry;
    private Boolean notifyEmailDailyReport;
    private Boolean notifyEmailWeeklyReport;
    private Boolean notifyEmailMonthlyReport;

    // 5. Notifications - System
    private Boolean notifySysLowStock;
    private Boolean notifySysBranchCreated;
    private Boolean notifySysEmployeeAdded;
    private Boolean notifySysPaymentReceived;
    private Boolean notifySysFailedPayment;

    // 7. Regional Settings
    private String currency;
    private String currencySymbol;
    private String dateFormat;
    private String timeFormat;
    private String timezone;
    private String language;
    private String numberFormat;
    private String financialYearStart;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
