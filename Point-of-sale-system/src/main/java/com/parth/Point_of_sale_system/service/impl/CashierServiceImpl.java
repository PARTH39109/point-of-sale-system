package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CashierCreateDto;
import com.parth.Point_of_sale_system.payload.dto.CashierDto;
import com.parth.Point_of_sale_system.repository.BranchRepository;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.UserRepository;
import com.parth.Point_of_sale_system.service.CashierService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.mapper.CashierMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashierServiceImpl implements CashierService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionService subscriptionService;

    private boolean isAdminLike(User user) {
        return user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_STORE_ADMIN;
    }

    private boolean isManagerLike(User user) {
        return user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_STORE_MANAGER;
    }

    private Store getUserStore(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) throw new Exception("No store associated with this store admin");
            return store;
        }
        Store store = user.getStore();
        if (store == null) throw new Exception("You are not associated with any store");
        return store;
    }

    private Branch resolveManagerBranch(User user) throws Exception {
        Employee managerRecord = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new Exception("No employee record found for this manager"));
        if (managerRecord.getBranch() == null) throw new Exception("No branch associated with this manager");
        return managerRecord.getBranch();
    }

    @Override
    @Transactional
    public CashierDto createCashier(CashierCreateDto dto, User currentUser) throws Exception {
        if (dto.getFullName() == null || dto.getFullName().isBlank()) throw new Exception("Full name is required");
        if (dto.getEmail() == null || dto.getEmail().isBlank()) throw new Exception("Email is required");
        if (dto.getPassword() == null || dto.getPassword().isBlank()) throw new Exception("Password is required");
        if (userRepository.findByEmail(dto.getEmail()) != null) throw new Exception("Email id already registered!");

        Branch branch;
        if (isManagerLike(currentUser)) {
            branch = resolveManagerBranch(currentUser);
        } else if (isAdminLike(currentUser)) {
            Store store = getUserStore(currentUser);
            if (dto.getBranchId() == null) throw new Exception("Please select a branch for this cashier");
            branch = branchRepository.findByIdAndStoreId(dto.getBranchId(), store.getId())
                    .orElseThrow(() -> new Exception("Selected branch does not belong to your store"));
        } else {
            throw new Exception("You are not authorized to add cashiers");
        }

        Store store = branch.getStore();
        subscriptionService.validateLimit(store.getId(), LimitType.EMPLOYEE);

        User newUser = new User();
        newUser.setFullName(dto.getFullName());
        newUser.setEmail(dto.getEmail());
        newUser.setPhone(dto.getPhone());
        newUser.setRole(UserRole.ROLE_CASHIER);
        newUser.setPassword(passwordEncoder.encode(dto.getPassword()));
        newUser.setStore(store);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(newUser);

        Employee employee = Employee.builder()
                .user(savedUser)
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .branch(branch)
                .store(store)
                .designation("Cashier")
                .salary(dto.getSalary())
                .isActive(true)
                .joiningDate(LocalDateTime.now())
                .build();

        return CashierMapper.toDto(employeeRepository.save(employee));
    }

    @Override
    public List<CashierDto> getCashiersForCurrentUser(User currentUser) throws Exception {
        List<Employee> cashiers;

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            cashiers = employeeRepository.findByBranchIdAndUserRole(branch.getId(), UserRole.ROLE_CASHIER);
        } else {
            Store store = getUserStore(currentUser);
            cashiers = employeeRepository.findByStoreIdAndUserRole(store.getId(), UserRole.ROLE_CASHIER);
        }

        return cashiers.stream().map(CashierMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public CashierDto getCashierById(Long id, User currentUser) throws Exception {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier", "id", id));

        if (employee.getUser() == null || employee.getUser().getRole() != UserRole.ROLE_CASHIER) {
            throw new ResourceNotFoundException("Cashier", "id", id);
        }

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            if (employee.getBranch() == null || !employee.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to view this cashier");
            }
        } else if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(currentUser);
            if (!employee.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to view this cashier");
            }
        }

        return CashierMapper.toDto(employee);
    }

    @Override
    @Transactional
    public CashierDto updateCashier(Long id, CashierCreateDto dto, User currentUser) throws Exception {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier", "id", id));

        if (employee.getUser() == null || employee.getUser().getRole() != UserRole.ROLE_CASHIER) {
            throw new ResourceNotFoundException("Cashier", "id", id);
        }

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            if (employee.getBranch() == null || !employee.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to update this cashier");
            }
        } else if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(currentUser);
            if (!employee.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to update this cashier");
            }
        }

        User user = employee.getUser();
        if (dto.getFullName() != null) { employee.setFullName(dto.getFullName()); user.setFullName(dto.getFullName()); }
        if (dto.getPhone() != null) { employee.setPhone(dto.getPhone()); user.setPhone(dto.getPhone()); }
        if (dto.getSalary() != null) employee.setSalary(dto.getSalary());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        user.setUpdatedAt(LocalDateTime.now());

        return CashierMapper.toDto(employeeRepository.save(employee));
    }

    @Override
    public void deleteCashier(Long id, User currentUser) throws Exception {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cashier", "id", id));

        if (employee.getUser() == null || employee.getUser().getRole() != UserRole.ROLE_CASHIER) {
            throw new ResourceNotFoundException("Cashier", "id", id);
        }

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            if (employee.getBranch() == null || !employee.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to delete this cashier");
            }
        } else if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(currentUser);
            if (!employee.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to delete this cashier");
            }
        }

        employeeRepository.delete(employee);
    }
}