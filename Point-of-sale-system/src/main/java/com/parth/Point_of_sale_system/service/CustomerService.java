package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CustomerDto;

import java.util.List;

public interface CustomerService {
    CustomerDto createCustomer(CustomerDto customerDto, User user);
    CustomerDto updateCustomer(Long id, CustomerDto customerDto, User user);
    void deleteCustomer(Long id, User user);
    List<CustomerDto> getCustomersByStoreId(Long storeId);
    List<CustomerDto> searchCustomers(Long storeId, String keyword);
    CustomerDto getCustomerById(Long id, User user);
    List<CustomerDto> getCustomersByBranchId(Long branchId);
    List<CustomerDto> searchCustomersByBranch(Long branchId, String keyword);
}
