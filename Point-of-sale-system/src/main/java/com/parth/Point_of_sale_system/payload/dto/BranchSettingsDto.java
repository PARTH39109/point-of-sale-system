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
public class BranchSettingsDto {
    private Long id;
    private Long branchId;
    
    // Read only Branch metadata
    private String branchName;
    private String branchCode;
    private String storeName;
    private String branchAddress;
    private String contactNumber;
    private String managerName;
    private Boolean branchIsActive;

    // Business Hours
    private String openingTime;
    private String closingTime;
    private String weeklyOff;
    private String holidaySchedule;

    // Receipt settings
    private String receiptBranchName;
    private String receiptAddress;
    private String receiptPhone;
    private String receiptGstNumber;
    private String receiptHeader;
    private String receiptFooter;
    private String receiptThankYouMessage;
    private String receiptReturnPolicy;
    private Boolean showGstNumber;
    private Boolean showBranchAddress;
    private Boolean showPhoneNumber;

    // Order settings
    private Boolean allowDiscounts;
    private Boolean allowManualPriceOverride;
    private Boolean allowHoldOrders;
    private Boolean allowResumeOrders;
    private Boolean requireCustomerBeforeCheckout;
    private Boolean allowOrderCancellation;

    // Shift settings
    private Boolean requireOpeningCash;
    private Double defaultOpeningCashAmount;
    private Integer maxShiftDuration;
    private Boolean requireClosingCashCount;
    private Boolean autoLogoutAfterShiftEnds;

    // Cashier permissions
    private Boolean permRefund;
    private Boolean permDiscount;
    private Boolean permHoldOrders;
    private Boolean permResumeOrders;
    private Boolean permCustomerCreation;
    private Boolean permPriceOverride;
    private Boolean permViewReports;
    private Boolean permEndShift;

    // Notifications
    private Boolean notifyLowStock;
    private Boolean notifyNewCashierRequests;
    private Boolean notifyShiftClosed;
    private Boolean notifyCashDifference;
    private Boolean notifyOrderCancel;

    // Security
    private Integer autoLogoutTimer;
    private Integer idleTimeout;
    private Boolean requirePasswordRefund;
    private Boolean requirePasswordDiscount;
    private Boolean requirePasswordPriceOverride;

    // Sync meta
    private LocalDateTime lastSyncTime;
    private LocalDateTime lastBackupTime;
    private String databaseStatus;
    private String internetStatus;
    private Boolean offlineModeStatus;
}
