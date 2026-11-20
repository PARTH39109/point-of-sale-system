package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.BranchSettings;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.BranchSettingsDto;
import com.parth.Point_of_sale_system.payload.dto.ManagerProfileUpdateDto;
import com.parth.Point_of_sale_system.repository.BranchRepository;
import com.parth.Point_of_sale_system.repository.BranchSettingsRepository;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.UserRepository;
import com.parth.Point_of_sale_system.service.BranchSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchSettingsServiceImpl implements BranchSettingsService {

    private final BranchSettingsRepository branchSettingsRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public BranchSettingsDto getSettingsForCurrentUser(User user) throws Exception {
        Long branchId = resolveBranchIdForUser(user);
        return getSettingsByBranchId(branchId);
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public BranchSettingsDto updateSettingsForCurrentUser(BranchSettingsDto settings, User user) throws Exception {
        Long branchId = resolveBranchIdForUser(user);
        
        BranchSettings entity = getOrCreateSettings(branchId);
        
        // Update Business Hours
        entity.setOpeningTime(settings.getOpeningTime());
        entity.setClosingTime(settings.getClosingTime());
        entity.setWeeklyOff(settings.getWeeklyOff());
        entity.setHolidaySchedule(settings.getHolidaySchedule());

        // Update Receipt Settings
        entity.setReceiptBranchName(settings.getReceiptBranchName());
        entity.setReceiptAddress(settings.getReceiptAddress());
        entity.setReceiptPhone(settings.getReceiptPhone());
        entity.setReceiptGstNumber(settings.getReceiptGstNumber());
        entity.setReceiptHeader(settings.getReceiptHeader());
        entity.setReceiptFooter(settings.getReceiptFooter());
        entity.setReceiptThankYouMessage(settings.getReceiptThankYouMessage());
        entity.setReceiptReturnPolicy(settings.getReceiptReturnPolicy());
        entity.setShowGstNumber(settings.getShowGstNumber());
        entity.setShowBranchAddress(settings.getShowBranchAddress());
        entity.setShowPhoneNumber(settings.getShowPhoneNumber());

        // Update Order Settings
        entity.setAllowDiscounts(settings.getAllowDiscounts());
        entity.setAllowManualPriceOverride(settings.getAllowManualPriceOverride());
        entity.setAllowHoldOrders(settings.getAllowHoldOrders());
        entity.setAllowResumeOrders(settings.getAllowResumeOrders());
        entity.setRequireCustomerBeforeCheckout(settings.getRequireCustomerBeforeCheckout());
        entity.setAllowOrderCancellation(settings.getAllowOrderCancellation());

        // Update Shift Settings
        entity.setRequireOpeningCash(settings.getRequireOpeningCash());
        entity.setDefaultOpeningCashAmount(settings.getDefaultOpeningCashAmount());
        entity.setMaxShiftDuration(settings.getMaxShiftDuration());
        entity.setRequireClosingCashCount(settings.getRequireClosingCashCount());
        entity.setAutoLogoutAfterShiftEnds(settings.getAutoLogoutAfterShiftEnds());

        // Update Cashier Permissions
        entity.setPermRefund(settings.getPermRefund());
        entity.setPermDiscount(settings.getPermDiscount());
        entity.setPermHoldOrders(settings.getPermHoldOrders());
        entity.setPermResumeOrders(settings.getPermResumeOrders());
        entity.setPermCustomerCreation(settings.getPermCustomerCreation());
        entity.setPermPriceOverride(settings.getPermPriceOverride());
        entity.setPermViewReports(settings.getPermViewReports());
        entity.setPermEndShift(settings.getPermEndShift());

        // Update Notifications
        entity.setNotifyLowStock(settings.getNotifyLowStock());
        entity.setNotifyNewCashierRequests(settings.getNotifyNewCashierRequests());
        entity.setNotifyShiftClosed(settings.getNotifyShiftClosed());
        entity.setNotifyCashDifference(settings.getNotifyCashDifference());
        entity.setNotifyOrderCancel(settings.getNotifyOrderCancel());

        // Update Security
        entity.setAutoLogoutTimer(settings.getAutoLogoutTimer());
        entity.setIdleTimeout(settings.getIdleTimeout());
        entity.setRequirePasswordRefund(settings.getRequirePasswordRefund());
        entity.setRequirePasswordDiscount(settings.getRequirePasswordDiscount());
        entity.setRequirePasswordPriceOverride(settings.getRequirePasswordPriceOverride());

        branchSettingsRepository.save(entity);
        return toDto(entity);
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public BranchSettingsDto getSettingsByBranchId(Long branchId) throws Exception {
        BranchSettings entity = getOrCreateSettings(branchId);
        return toDto(entity);
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public BranchSettings getOrCreateSettings(Long branchId) throws Exception {
        Optional<BranchSettings> settingsOpt = branchSettingsRepository.findByBranchId(branchId);
        if (settingsOpt.isPresent()) {
            return settingsOpt.get();
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new Exception("Branch not found with ID: " + branchId));

        BranchSettings defaultSettings = BranchSettings.builder()
                .branch(branch)
                .receiptBranchName(branch.getName())
                .receiptAddress(branch.getAddress())
                .receiptPhone(branch.getPhone())
                .openingTime("09:00 AM")
                .closingTime("10:00 PM")
                .weeklyOff("None")
                .build();

        return branchSettingsRepository.save(defaultSettings);
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public void synchronizeBranchData(User user) throws Exception {
        Long branchId = resolveBranchIdForUser(user);
        BranchSettings entity = getOrCreateSettings(branchId);
        entity.setLastSyncTime(LocalDateTime.now());
        entity.setLastBackupTime(LocalDateTime.now());
        entity.setInternetStatus("ONLINE");
        entity.setDatabaseStatus("HEALTHY");
        branchSettingsRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = false, rollbackFor = Exception.class)
    public User updateManagerProfile(User user, ManagerProfileUpdateDto profileDto) throws Exception {
        if (profileDto.getFullName() != null && !profileDto.getFullName().isBlank()) {
            user.setFullName(profileDto.getFullName());
        }
        if (profileDto.getPhone() != null && !profileDto.getPhone().isBlank()) {
            user.setPhone(profileDto.getPhone());
        }
        if (profileDto.getEmail() != null && !profileDto.getEmail().isBlank()) {
            // Check email uniqueness if email is changing
            if (!profileDto.getEmail().equalsIgnoreCase(user.getEmail())) {
                User existing = userRepository.findByEmail(profileDto.getEmail());
                if (existing != null) {
                    throw new Exception("Email address is already in use by another user.");
                }
                user.setEmail(profileDto.getEmail());
            }
        }
        if (profileDto.getPassword() != null && !profileDto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(profileDto.getPassword()));
        }
        if (profileDto.getProfilePicture() != null) {
            user.setProfilePicture(profileDto.getProfilePicture());
        }
        
        // Sync Employee record as employee holds the source of truth for staff listing
        Optional<Employee> empOpt = employeeRepository.findByUserId(user.getId());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            if (profileDto.getFullName() != null) emp.setFullName(profileDto.getFullName());
            if (profileDto.getPhone() != null) emp.setPhone(profileDto.getPhone());
            employeeRepository.save(emp);
        }

        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private Long resolveBranchIdForUser(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            throw new Exception("Store Admin settings are managed globally. This endpoint is branch-only.");
        }
        Employee emp = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new Exception("No employee record found for user: " + user.getEmail()));
        if (emp.getBranch() == null) {
            throw new Exception("Employee is not assigned to a branch.");
        }
        return emp.getBranch().getId();
    }

    private BranchSettingsDto toDto(BranchSettings e) {
        Branch b = e.getBranch();
        return BranchSettingsDto.builder()
                .id(e.getId())
                .branchId(b.getId())
                .branchName(b.getName())
                .branchCode("BR-" + b.getId())
                .storeName(b.getStore() != null ? b.getStore().getBrand() : "")
                .branchAddress(b.getAddress())
                .contactNumber(b.getPhone())
                .managerName(b.getManagerName())
                .branchIsActive(b.getIsActive())
                
                .openingTime(e.getOpeningTime())
                .closingTime(e.getClosingTime())
                .weeklyOff(e.getWeeklyOff())
                .holidaySchedule(e.getHolidaySchedule())
                
                .receiptBranchName(e.getReceiptBranchName())
                .receiptAddress(e.getReceiptAddress())
                .receiptPhone(e.getReceiptPhone())
                .receiptGstNumber(e.getReceiptGstNumber())
                .receiptHeader(e.getReceiptHeader())
                .receiptFooter(e.getReceiptFooter())
                .receiptThankYouMessage(e.getReceiptThankYouMessage())
                .receiptReturnPolicy(e.getReceiptReturnPolicy())
                .showGstNumber(e.getShowGstNumber())
                .showBranchAddress(e.getShowBranchAddress())
                .showPhoneNumber(e.getShowPhoneNumber())
                
                .allowDiscounts(e.getAllowDiscounts())
                .allowManualPriceOverride(e.getAllowManualPriceOverride())
                .allowHoldOrders(e.getAllowHoldOrders())
                .allowResumeOrders(e.getAllowResumeOrders())
                .requireCustomerBeforeCheckout(e.getRequireCustomerBeforeCheckout())
                .allowOrderCancellation(e.getAllowOrderCancellation())
                
                .requireOpeningCash(e.getRequireOpeningCash())
                .defaultOpeningCashAmount(e.getDefaultOpeningCashAmount())
                .maxShiftDuration(e.getMaxShiftDuration())
                .requireClosingCashCount(e.getRequireClosingCashCount())
                .autoLogoutAfterShiftEnds(e.getAutoLogoutAfterShiftEnds())
                
                .permRefund(e.getPermRefund())
                .permDiscount(e.getPermDiscount())
                .permHoldOrders(e.getPermHoldOrders())
                .permResumeOrders(e.getPermResumeOrders())
                .permCustomerCreation(e.getPermCustomerCreation())
                .permPriceOverride(e.getPermPriceOverride())
                .permViewReports(e.getPermViewReports())
                .permEndShift(e.getPermEndShift())
                
                .notifyLowStock(e.getNotifyLowStock())
                .notifyNewCashierRequests(e.getNotifyNewCashierRequests())
                .notifyShiftClosed(e.getNotifyShiftClosed())
                .notifyCashDifference(e.getNotifyCashDifference())
                .notifyOrderCancel(e.getNotifyOrderCancel())
                
                .autoLogoutTimer(e.getAutoLogoutTimer())
                .idleTimeout(e.getIdleTimeout())
                .requirePasswordRefund(e.getRequirePasswordRefund())
                .requirePasswordDiscount(e.getRequirePasswordDiscount())
                .requirePasswordPriceOverride(e.getRequirePasswordPriceOverride())
                
                .lastSyncTime(e.getLastSyncTime())
                .lastBackupTime(e.getLastBackupTime())
                .databaseStatus(e.getDatabaseStatus())
                .internetStatus(e.getInternetStatus())
                .offlineModeStatus(e.getOfflineModeStatus())
                .build();
    }
}
