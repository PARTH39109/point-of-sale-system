package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CashierCreateDto;
import com.parth.Point_of_sale_system.payload.dto.CashierDto;

import java.util.List;

public interface CashierService {
    CashierDto createCashier(CashierCreateDto dto, User currentUser) throws Exception;
    List<CashierDto> getCashiersForCurrentUser(User currentUser) throws Exception;
    CashierDto getCashierById(Long id, User currentUser) throws Exception;
    CashierDto updateCashier(Long id, CashierCreateDto dto, User currentUser) throws Exception;
    void deleteCashier(Long id, User currentUser) throws Exception;
}