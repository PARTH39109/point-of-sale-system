package com.parth.Point_of_sale_system.modal;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false, unique = true)
    private Store store;

    // 1. Business Profile
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
    
    @Column(length = 1000)
    private String businessDescription;

    // 2. Branch Defaults
    private Long defaultBranchId;
    private String branchCodePrefix;
    private Boolean autoGenerateBranchCode;
    private String defaultBranchStatus;

    // 3. Payment Gateway (Razorpay)
    private String razorpayKeyId;
    private String razorpaySecretKey;
    private String razorpayWebhookSecret;
    private Boolean razorpayTestMode;
    private Boolean enableOnlinePayments;

    // 4. Tax & GST
    private Boolean enableGst;
    private String taxPricingType; // "INCLUSIVE" or "EXCLUSIVE"
    private Double defaultGstRate;
    private Double cgstRate;
    private Double sgstRate;
    private Double igstRate;
    
    @Column(length = 500)
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

    @PrePersist
    protected void onCreated() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (branchCodePrefix == null) branchCodePrefix = "BR";
        if (autoGenerateBranchCode == null) autoGenerateBranchCode = true;
        if (defaultBranchStatus == null) defaultBranchStatus = "ACTIVE";
        if (razorpayTestMode == null) razorpayTestMode = true;
        if (enableOnlinePayments == null) enableOnlinePayments = false;
        if (enableGst == null) enableGst = true;
        if (taxPricingType == null) taxPricingType = "EXCLUSIVE";
        if (defaultGstRate == null) defaultGstRate = 18.0;
        if (cgstRate == null) cgstRate = 9.0;
        if (sgstRate == null) sgstRate = 9.0;
        if (igstRate == null) igstRate = 18.0;
        if (currency == null) currency = "INR";
        if (currencySymbol == null) currencySymbol = "₹";
        if (dateFormat == null) dateFormat = "DD/MM/YYYY";
        if (timeFormat == null) timeFormat = "12h";
        if (timezone == null) timezone = "Asia/Kolkata";
        if (language == null) language = "English";
        if (numberFormat == null) numberFormat = "en-IN";
        if (financialYearStart == null) financialYearStart = "April";

        if (notifyEmailNewEmployee == null) notifyEmailNewEmployee = true;
        if (notifyEmailNewBranch == null) notifyEmailNewBranch = true;
        if (notifyEmailSubExpiry == null) notifyEmailSubExpiry = true;
        if (notifyEmailDailyReport == null) notifyEmailDailyReport = false;
        if (notifyEmailWeeklyReport == null) notifyEmailWeeklyReport = true;
        if (notifyEmailMonthlyReport == null) notifyEmailMonthlyReport = true;

        if (notifySysLowStock == null) notifySysLowStock = true;
        if (notifySysBranchCreated == null) notifySysBranchCreated = true;
        if (notifySysEmployeeAdded == null) notifySysEmployeeAdded = true;
        if (notifySysPaymentReceived == null) notifySysPaymentReceived = true;
        if (notifySysFailedPayment == null) notifySysFailedPayment = true;
    }

    @PreUpdate
    protected void onUpdated() {
        updatedAt = LocalDateTime.now();
    }
}
