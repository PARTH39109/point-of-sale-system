package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface ShiftService {
    ShiftDto startShift(StartShiftRequest request, User currentUser) throws Exception;
    ShiftDto endShift(Long shiftId, EndShiftRequest request, User currentUser) throws Exception;
    ShiftDto getActiveShiftForCurrentUser(User currentUser) throws Exception;

    List<ShiftDto> getShifts(User currentUser, LocalDate date, Long cashierIdFilter,
                             Long branchIdFilter, String shiftLabelFilter, String statusFilter) throws Exception;

    ShiftKpiDto getKpis(User currentUser, LocalDate date, Long branchIdFilter) throws Exception;

    ShiftReportDto getShiftReport(Long shiftId, User currentUser) throws Exception;
}