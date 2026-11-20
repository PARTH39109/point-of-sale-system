package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.AuditLog;
import com.parth.Point_of_sale_system.modal.StoreSettings;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.AboutStoreDto;
import com.parth.Point_of_sale_system.payload.dto.ChangePasswordRequest;
import com.parth.Point_of_sale_system.payload.dto.StoreSettingsDto;

import java.util.List;

public interface StoreSettingsService {
    StoreSettingsDto getSettingsForCurrentUser(User user) throws Exception;
    StoreSettingsDto updateSettingsForCurrentUser(StoreSettingsDto dto, User user) throws Exception;
    AboutStoreDto getAboutStoreInfo(User user) throws Exception;
    List<AuditLog> getAuditLogs(User user) throws Exception;
    void changePassword(User user, ChangePasswordRequest request) throws Exception;
    void logAudit(Long storeId, String userEmail, String action, String module, String status, String details);
}
