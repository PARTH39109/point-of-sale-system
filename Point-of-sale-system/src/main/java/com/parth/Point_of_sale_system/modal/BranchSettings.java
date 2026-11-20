package com.parth.Point_of_sale_system.modal;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "branch_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false, unique = true)
    private Branch branch;

    // ── Business Hours ──
    private String openingTime;
    private String closingTime;
    private String weeklyOff;
    private String holidaySchedule;

    // ── Receipt Settings ──
    private String receiptBranchName;
    private String receiptAddress;
    private String receiptPhone;
    private String receiptGstNumber;
    @Column(length = 500)
    private String receiptHeader;
    @Column(length = 500)
    private String receiptFooter;
    private String receiptThankYouMessage;
    @Column(length = 500)
    private String receiptReturnPolicy;
    private Boolean showGstNumber;
    private Boolean showBranchAddress;
    private Boolean showPhoneNumber;

    // ── Order Settings ──
    private Boolean allowDiscounts;
    private Boolean allowManualPriceOverride;
    private Boolean allowHoldOrders;
    private Boolean allowResumeOrders;
    private Boolean requireCustomerBeforeCheckout;
    private Boolean allowOrderCancellation;

    // ── Shift Settings ──
    private Boolean requireOpeningCash;
    private Double defaultOpeningCashAmount;
    private Integer maxShiftDuration;
    private Boolean requireClosingCashCount;
    private Boolean autoLogoutAfterShiftEnds;

    // ── Cashier Permissions ──
    private Boolean permRefund;
    private Boolean permDiscount;
    private Boolean permHoldOrders;
    private Boolean permResumeOrders;
    private Boolean permCustomerCreation;
    private Boolean permPriceOverride;
    private Boolean permViewReports;
    private Boolean permEndShift;

    // ── Notification Settings ──
    private Boolean notifyLowStock;
    private Boolean notifyNewCashierRequests;
    private Boolean notifyShiftClosed;
    private Boolean notifyCashDifference;
    private Boolean notifyOrderCancel;

    // ── Security Settings ──
    private Integer autoLogoutTimer;
    private Integer idleTimeout;
    private Boolean requirePasswordRefund;
    private Boolean requirePasswordDiscount;
    private Boolean requirePasswordPriceOverride;

    // ── Backup & Sync Meta ──
    private LocalDateTime lastSyncTime;
    private LocalDateTime lastBackupTime;
    private String databaseStatus;
    private String internetStatus;
    private Boolean offlineModeStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreated() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        // Initialize default values for settings
        if (showGstNumber == null) showGstNumber = true;
        if (showBranchAddress == null) showBranchAddress = true;
        if (showPhoneNumber == null) showPhoneNumber = true;
        if (allowDiscounts == null) allowDiscounts = true;
        if (allowManualPriceOverride == null) allowManualPriceOverride = false;
        if (allowHoldOrders == null) allowHoldOrders = true;
        if (allowResumeOrders == null) allowResumeOrders = true;
        if (requireCustomerBeforeCheckout == null) requireCustomerBeforeCheckout = false;
        if (allowOrderCancellation == null) allowOrderCancellation = true;
        if (requireOpeningCash == null) requireOpeningCash = true;
        if (defaultOpeningCashAmount == null) defaultOpeningCashAmount = 5000.0;
        if (maxShiftDuration == null) maxShiftDuration = 8;
        if (requireClosingCashCount == null) requireClosingCashCount = true;
        if (autoLogoutAfterShiftEnds == null) autoLogoutAfterShiftEnds = false;
        if (permRefund == null) permRefund = false;
        if (permDiscount == null) permDiscount = true;
        if (permHoldOrders == null) permHoldOrders = true;
        if (permResumeOrders == null) permResumeOrders = true;
        if (permCustomerCreation == null) permCustomerCreation = true;
        if (permPriceOverride == null) permPriceOverride = false;
        if (permViewReports == null) permViewReports = false;
        if (permEndShift == null) permEndShift = true;
        if (notifyLowStock == null) notifyLowStock = true;
        if (notifyNewCashierRequests == null) notifyNewCashierRequests = true;
        if (notifyShiftClosed == null) notifyShiftClosed = true;
        if (notifyCashDifference == null) notifyCashDifference = true;
        if (notifyOrderCancel == null) notifyOrderCancel = true;
        if (autoLogoutTimer == null) autoLogoutTimer = 60;
        if (idleTimeout == null) idleTimeout = 15;
        if (requirePasswordRefund == null) requirePasswordRefund = true;
        if (requirePasswordDiscount == null) requirePasswordDiscount = false;
        if (requirePasswordPriceOverride == null) requirePasswordPriceOverride = true;
        if (offlineModeStatus == null) offlineModeStatus = false;
        if (databaseStatus == null) databaseStatus = "HEALTHY";
        if (internetStatus == null) internetStatus = "ONLINE";
    }

    @PreUpdate
    protected void onUpdated() {
        updatedAt = LocalDateTime.now();
    }
}
