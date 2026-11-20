package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.mapper.CustomerMapper;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Customer;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CustomerDto;
import com.parth.Point_of_sale_system.repository.CustomerRepository;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.service.CustomerService;
import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final EmployeeRepository employeeRepository;
    private final SubscriptionService subscriptionService;

    private Store resolveStore(User user) {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) {
                throw new RuntimeException("No store associated with this store admin");
            }
            return store;
        }
        Store store = user.getStore();
        if (store == null) {
            throw new RuntimeException("You are not associated with any store");
        }
        return store;
    }

    // Mirrors CustomerController.resolveBranchId: Cashiers and Branch Managers
    // create customers scoped to their own branch. Admins/Store Admins have no
    // single branch, so their customers stay store-wide (branch = null).
    private Branch resolveBranch(User user) {
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_CASHIER) {
            return employeeRepository.findByUserId(user.getId())
                    .map(Employee::getBranch)
                    .orElse(null);
        }
        return null;
    }

    @Override
    public CustomerDto createCustomer(CustomerDto customerDto, User user) {
        Store store = resolveStore(user);
        subscriptionService.validateLimit(store.getId(), LimitType.CUSTOMER);

        Customer customer = CustomerMapper.toEntity(customerDto);
        customer.setStore(store);
        // This was the bug: branch was never set, so a customer added by a
        // Cashier/Manager had branch = NULL and silently vanished from every
        // branch-scoped list (including the creator's own), even though the
        // record was saved successfully.
        customer.setBranch(resolveBranch(user));

        Customer savedCustomer = customerRepository.save(customer);
        return CustomerMapper.toDto(savedCustomer);
    }

    @Override
    public CustomerDto updateCustomer(Long id, CustomerDto customerDto, User user) {
        Store store = resolveStore(user);

        Customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (!existingCustomer.getStore().getId().equals(store.getId())) {
            throw new RuntimeException("You can only update customers in your own store");
        }

        existingCustomer.setName(customerDto.getName());
        existingCustomer.setEmail(customerDto.getEmail());
        existingCustomer.setPhone(customerDto.getPhone());
        existingCustomer.setAddress(customerDto.getAddress());
        existingCustomer.setLoyaltyPoints(customerDto.getLoyaltyPoints());
        existingCustomer.setNotes(customerDto.getNotes());

        Customer updatedCustomer = customerRepository.save(existingCustomer);
        return CustomerMapper.toDto(updatedCustomer);
    }

    @Override
    public void deleteCustomer(Long id, User user) {
        Store store = resolveStore(user);

        Customer existingCustomer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (!existingCustomer.getStore().getId().equals(store.getId())) {
            throw new RuntimeException("You can only delete customers in your own store");
        }

        customerRepository.delete(existingCustomer);
    }

    @Override
    public List<CustomerDto> getCustomersByStoreId(Long storeId) {
        return customerRepository.findByStoreId(storeId).stream()
                .map(CustomerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerDto> searchCustomers(Long storeId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getCustomersByStoreId(storeId);
        }
        return customerRepository.searchByKeyword(storeId, keyword).stream()
                .map(CustomerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerDto getCustomerById(Long id, User user) {
        Store store = resolveStore(user);

        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        if (!customer.getStore().getId().equals(store.getId())) {
            throw new RuntimeException("You can only access customers in your own store");
        }

        return CustomerMapper.toDto(customer);
    }

    @Override
    public List<CustomerDto> getCustomersByBranchId(Long branchId) {
        return customerRepository.findByBranchId(branchId).stream()
                .map(CustomerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CustomerDto> searchCustomersByBranch(Long branchId, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getCustomersByBranchId(branchId);
        }
        return customerRepository.searchByBranchAndKeyword(branchId, keyword).stream()
                .map(CustomerMapper::toDto)
                .collect(Collectors.toList());
    }
}