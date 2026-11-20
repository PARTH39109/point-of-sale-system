package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.modal.*;
import com.parth.Point_of_sale_system.payload.dto.AboutStoreDto;
import com.parth.Point_of_sale_system.payload.dto.ChangePasswordRequest;
import com.parth.Point_of_sale_system.payload.dto.StoreSettingsDto;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.StoreSettingsService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreSettingsServiceImpl implements StoreSettingsService {

    private final StoreSettingsRepository storeSettingsRepository;
    private final AuditLogRepository auditLogRepository;
    private final StoreRepository storeRepository;
    private final StoreSubscriptionRepository storeSubscriptionRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern GST_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public StoreSettingsDto getSettingsForCurrentUser(User user) throws Exception {
        Store store = userService.resolveStoreForUser(user);
        StoreSettings settings = getOrCreateSettings(store);
        return toDto(settings, store);
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public StoreSettingsDto updateSettingsForCurrentUser(StoreSettingsDto dto, User user) throws Exception {
        Store store = userService.resolveStoreForUser(user);
        StoreSettings settings = getOrCreateSettings(store);

        // Validation
        if (dto.getGstNumber() != null && !dto.getGstNumber().isBlank()) {
            String gst = dto.getGstNumber().trim().toUpperCase();
            if (!GST_PATTERN.matcher(gst).matches()) {
                throw new Exception("Invalid GSTIN format. Expected format e.g. 27AAAAA1111A1Z1");
            }
            settings.setGstNumber(gst);
        } else {
            settings.setGstNumber(dto.getGstNumber());
        }

        if (dto.getSupportEmail() != null && !dto.getSupportEmail().isBlank()) {
            if (!dto.getSupportEmail().contains("@")) {
                throw new Exception("Invalid support email format.");
            }
        }

        // Update Store Brand name if storeName provided
        if (dto.getStoreName() != null && !dto.getStoreName().isBlank()) {
            store.setBrand(dto.getStoreName().trim());
            storeRepository.save(store);
        }

        // Business Profile
        settings.setLogoUrl(dto.getLogoUrl());
        settings.setLegalBusinessName(dto.getLegalBusinessName());
        settings.setBusinessType(dto.getBusinessType());
        settings.setPanNumber(dto.getPanNumber());
        settings.setRegisteredAddress(dto.getRegisteredAddress());
        settings.setCity(dto.getCity());
        settings.setState(dto.getState());
        settings.setCountry(dto.getCountry());
        settings.setPincode(dto.getPincode());
        settings.setSupportEmail(dto.getSupportEmail());
        settings.setSupportPhone(dto.getSupportPhone());
        settings.setWebsite(dto.getWebsite());
        settings.setBusinessDescription(dto.getBusinessDescription());

        // Branch Defaults
        settings.setDefaultBranchId(dto.getDefaultBranchId());
        settings.setBranchCodePrefix(dto.getBranchCodePrefix());
        settings.setAutoGenerateBranchCode(dto.getAutoGenerateBranchCode());
        settings.setDefaultBranchStatus(dto.getDefaultBranchStatus());

        // Payment Gateway (Razorpay)
        settings.setRazorpayKeyId(dto.getRazorpayKeyId());
        if (dto.getRazorpaySecretKey() != null && !dto.getRazorpaySecretKey().isBlank()) {
            settings.setRazorpaySecretKey(dto.getRazorpaySecretKey());
        }
        settings.setRazorpayWebhookSecret(dto.getRazorpayWebhookSecret());
        settings.setRazorpayTestMode(dto.getRazorpayTestMode());
        settings.setEnableOnlinePayments(dto.getEnableOnlinePayments());

        // Tax & GST
        settings.setEnableGst(dto.getEnableGst());
        settings.setTaxPricingType(dto.getTaxPricingType());
        settings.setDefaultGstRate(dto.getDefaultGstRate());
        settings.setCgstRate(dto.getCgstRate());
        settings.setSgstRate(dto.getSgstRate());
        settings.setIgstRate(dto.getIgstRate());
        settings.setInvoiceTaxNotes(dto.getInvoiceTaxNotes());

        // Notifications - Email
        settings.setNotifyEmailNewEmployee(dto.getNotifyEmailNewEmployee());
        settings.setNotifyEmailNewBranch(dto.getNotifyEmailNewBranch());
        settings.setNotifyEmailSubExpiry(dto.getNotifyEmailSubExpiry());
        settings.setNotifyEmailDailyReport(dto.getNotifyEmailDailyReport());
        settings.setNotifyEmailWeeklyReport(dto.getNotifyEmailWeeklyReport());
        settings.setNotifyEmailMonthlyReport(dto.getNotifyEmailMonthlyReport());

        // Notifications - System
        settings.setNotifySysLowStock(dto.getNotifySysLowStock());
        settings.setNotifySysBranchCreated(dto.getNotifySysBranchCreated());
        settings.setNotifySysEmployeeAdded(dto.getNotifySysEmployeeAdded());
        settings.setNotifySysPaymentReceived(dto.getNotifySysPaymentReceived());
        settings.setNotifySysFailedPayment(dto.getNotifySysFailedPayment());

        // Regional Settings
        settings.setCurrency(dto.getCurrency());
        settings.setCurrencySymbol(dto.getCurrencySymbol());
        settings.setDateFormat(dto.getDateFormat());
        settings.setTimeFormat(dto.getTimeFormat());
        settings.setTimezone(dto.getTimezone());
        settings.setLanguage(dto.getLanguage());
        settings.setNumberFormat(dto.getNumberFormat());
        settings.setFinancialYearStart(dto.getFinancialYearStart());

        StoreSettings saved = storeSettingsRepository.save(settings);

        // Audit Log
        logAudit(store.getId(), user.getEmail(), "UPDATE_SETTINGS", "Store Settings", "SUCCESS", "Enterprise store settings updated.");

        return toDto(saved, store);
    }

    @Override
    public AboutStoreDto getAboutStoreInfo(User user) throws Exception {
        Store store = userService.resolveStoreForUser(user);

        long branchesCount = branchRepository.countByStoreId(store.getId());
        long employeesCount = employeeRepository.findByStoreId(store.getId()).size();
        long productsCount = productRepository.countByStoreId(store.getId());

        Optional<StoreSubscription> subOpt = storeSubscriptionRepository.findByStoreId(store.getId());
        String planName = subOpt.map(s -> s.getPlan().getName()).orElse("Basic");
        LocalDateTime expiry = subOpt.map(StoreSubscription::getEndDate).orElse(LocalDateTime.now().plusYears(100));
        int daysRem = (int) ChronoUnit.DAYS.between(LocalDateTime.now(), expiry);

        User owner = store.getStoreAdmin();
        String ownerName = owner != null ? owner.getFullName() : "N/A";
        String ownerEmail = owner != null ? owner.getEmail() : "N/A";

        return AboutStoreDto.builder()
                .storeId(store.getId())
                .storeName(store.getBrand())
                .storeOwner(ownerName)
                .ownerEmail(ownerEmail)
                .subscriptionPlan(planName)
                .subscriptionExpiry(expiry)
                .daysRemaining(daysRem)
                .numberOfBranches(branchesCount)
                .numberOfEmployees(employeesCount)
                .numberOfProducts(productsCount)
                .databaseStatus("HEALTHY")
                .apiVersion("v3.5.0")
                .applicationVersion("Build 2026.07.24")
                .createdOn(store.getCreatedAt() != null ? store.getCreatedAt() : LocalDateTime.now())
                .lastUpdated(store.getUpdatedAt() != null ? store.getUpdatedAt() : LocalDateTime.now())
                .build();
    }

    @Override
    public List<AuditLog> getAuditLogs(User user) throws Exception {
        Store store = userService.resolveStoreForUser(user);
        return auditLogRepository.findByStoreIdOrderByTimestampDesc(store.getId());
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public void changePassword(User user, ChangePasswordRequest request) throws Exception {
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new Exception("Current password is required.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new Exception("New password is required.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new Exception("New password and confirm password do not match.");
        }
        if (request.getNewPassword().length() < 6) {
            throw new Exception("New password must be at least 6 characters.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new Exception("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        Store store = userService.resolveStoreForUser(user);
        logAudit(store.getId(), user.getEmail(), "CHANGE_PASSWORD", "Security", "SUCCESS", "Store Admin changed account password.");
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public void logAudit(Long storeId, String userEmail, String action, String module, String status, String details) {
        try {
            AuditLog log = AuditLog.builder()
                    .storeId(storeId)
                    .userEmail(userEmail)
                    .action(action)
                    .module(module)
                    .status(status)
                    .details(details)
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Silently swallow audit log failure to not disrupt primary transaction
        }
    }

    private StoreSettings getOrCreateSettings(Store store) {
        return storeSettingsRepository.findByStoreId(store.getId())
                .orElseGet(() -> {
                    StoreSettings defaultSettings = StoreSettings.builder()
                            .store(store)
                            .legalBusinessName(store.getBrand())
                            .registeredAddress(store.getContact() != null ? store.getContact().getAddress() : "")
                            .supportPhone(store.getContact() != null ? store.getContact().getPhone() : "")
                            .supportEmail(store.getContact() != null ? store.getContact().getEmail() : "")
                            .build();
                    return storeSettingsRepository.save(defaultSettings);
                });
    }

    private StoreSettingsDto toDto(StoreSettings s, Store store) {
        int maxEmp = 5; // default
        Optional<StoreSubscription> subOpt = storeSubscriptionRepository.findByStoreId(store.getId());
        if (subOpt.isPresent() && subOpt.get().getPlan() != null && subOpt.get().getPlan().getMaxEmployees() != null) {
            maxEmp = subOpt.get().getPlan().getMaxEmployees();
        }

        return StoreSettingsDto.builder()
                .id(s.getId())
                .storeId(store.getId())
                .storeName(store.getBrand())
                .logoUrl(s.getLogoUrl())
                .legalBusinessName(s.getLegalBusinessName())
                .businessType(s.getBusinessType())
                .gstNumber(s.getGstNumber())
                .panNumber(s.getPanNumber())
                .registeredAddress(s.getRegisteredAddress())
                .city(s.getCity())
                .state(s.getState())
                .country(s.getCountry())
                .pincode(s.getPincode())
                .supportEmail(s.getSupportEmail())
                .supportPhone(s.getSupportPhone())
                .website(s.getWebsite())
                .businessDescription(s.getBusinessDescription())
                
                .defaultBranchId(s.getDefaultBranchId())
                .branchCodePrefix(s.getBranchCodePrefix())
                .autoGenerateBranchCode(s.getAutoGenerateBranchCode())
                .defaultBranchStatus(s.getDefaultBranchStatus())
                .maxEmployeesPerBranch(maxEmp)

                .razorpayKeyId(s.getRazorpayKeyId())
                .razorpaySecretKey(s.getRazorpaySecretKey() != null && !s.getRazorpaySecretKey().isBlank() ? "••••••••••••" : "")
                .razorpayWebhookSecret(s.getRazorpayWebhookSecret() != null && !s.getRazorpayWebhookSecret().isBlank() ? "••••••••••••" : "")
                .razorpayTestMode(s.getRazorpayTestMode())
                .enableOnlinePayments(s.getEnableOnlinePayments())

                .enableGst(s.getEnableGst())
                .taxPricingType(s.getTaxPricingType())
                .defaultGstRate(s.getDefaultGstRate())
                .cgstRate(s.getCgstRate())
                .sgstRate(s.getSgstRate())
                .igstRate(s.getIgstRate())
                .invoiceTaxNotes(s.getInvoiceTaxNotes())

                .notifyEmailNewEmployee(s.getNotifyEmailNewEmployee())
                .notifyEmailNewBranch(s.getNotifyEmailNewBranch())
                .notifyEmailSubExpiry(s.getNotifyEmailSubExpiry())
                .notifyEmailDailyReport(s.getNotifyEmailDailyReport())
                .notifyEmailWeeklyReport(s.getNotifyEmailWeeklyReport())
                .notifyEmailMonthlyReport(s.getNotifyEmailMonthlyReport())

                .notifySysLowStock(s.getNotifySysLowStock())
                .notifySysBranchCreated(s.getNotifySysBranchCreated())
                .notifySysEmployeeAdded(s.getNotifySysEmployeeAdded())
                .notifySysPaymentReceived(s.getNotifySysPaymentReceived())
                .notifySysFailedPayment(s.getNotifySysFailedPayment())

                .currency(s.getCurrency())
                .currencySymbol(s.getCurrencySymbol())
                .dateFormat(s.getDateFormat())
                .timeFormat(s.getTimeFormat())
                .timezone(s.getTimezone())
                .language(s.getLanguage())
                .numberFormat(s.getNumberFormat())
                .financialYearStart(s.getFinancialYearStart())

                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
