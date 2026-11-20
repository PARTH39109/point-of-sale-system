package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestCreateDto;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestDto;
import com.parth.Point_of_sale_system.payload.dto.BranchOptionDto;
import com.parth.Point_of_sale_system.payload.dto.RejectRequestDto;
import com.parth.Point_of_sale_system.payload.dto.StoreOptionDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;

import java.util.List;

public interface ManagerAccessRequestService {

    List<StoreOptionDto> getAvailableStores();

    List<BranchOptionDto> getBranchesForStore(Long storeId) throws Exception;

    ApiResponse createRequest(AccessRequestCreateDto dto) throws UserException;

    /**
     * Returns requests scoped to the caller:
     * - Store Admin  -> pending Branch Manager requests for their store
     * - Branch Manager -> pending Cashier requests for their branch
     */
    List<AccessRequestDto> getRequestsForCurrentUser(User currentUser, String status) throws Exception;

    AccessRequestDto approveRequest(Long requestId, User currentUser) throws Exception;

    AccessRequestDto rejectRequest(Long requestId, RejectRequestDto rejectDto, User currentUser) throws Exception;
}