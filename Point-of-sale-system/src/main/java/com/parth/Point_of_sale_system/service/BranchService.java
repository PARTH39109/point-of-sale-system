package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.BranchDto;

import java.util.List;

public interface BranchService {
    BranchDto createBranch(BranchDto branchDto, User user) throws Exception;
    BranchDto getBranchById(Long id, User user) throws Exception;
    List<BranchDto> getBranchesByStore(User user) throws Exception;
    BranchDto updateBranch(Long id, BranchDto branchDto, User user) throws Exception;
    void deleteBranch(Long id, User user) throws Exception;
}
