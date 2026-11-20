package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.BranchSettings;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.BranchSettingsDto;
import com.parth.Point_of_sale_system.payload.dto.ManagerProfileUpdateDto;

public interface BranchSettingsService {
    BranchSettingsDto getSettingsForCurrentUser(User user) throws Exception;
    BranchSettingsDto updateSettingsForCurrentUser(BranchSettingsDto settings, User user) throws Exception;
    BranchSettingsDto getSettingsByBranchId(Long branchId) throws Exception;
    BranchSettings getOrCreateSettings(Long branchId) throws Exception;
    void synchronizeBranchData(User user) throws Exception;
    User updateManagerProfile(User user, ManagerProfileUpdateDto profileDto) throws Exception;
}
