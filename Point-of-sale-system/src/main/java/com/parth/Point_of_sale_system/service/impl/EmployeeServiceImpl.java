package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.EmployeeDto;
import com.parth.Point_of_sale_system.repository.BranchRepository;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.service.EmployeeService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.service.mapper.EmployeeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;
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
    public EmployeeDto createEmployee(EmployeeDto dto, User currentUser) throws Exception {
        if (dto.getFullName() == null || dto.getFullName().isBlank()) {
            throw new Exception("Full name is required");
        }
        if (dto.getPhone() == null || dto.getPhone().isBlank()) {
            throw new Exception("Phone number is required");
        }
        if (dto.getSalary() == null) {
            throw new Exception("Monthly salary is required");
        }

        Store store;
        Branch branch;

        if (isManagerLike(currentUser)) {
            branch = resolveManagerBranch(currentUser);
            store = branch.getStore();
        } else if (isAdminLike(currentUser)) {
            store = getUserStore(currentUser);
            if (dto.getBranchId() == null) throw new Exception("Please select a branch for this employee");
            branch = branchRepository.findByIdAndStoreId(dto.getBranchId(), store.getId())
                    .orElseThrow(() -> new Exception("Selected branch does not belong to your store"));
        } else {
            throw new Exception("You are not authorized to add employees");
        }

        subscriptionService.validateLimit(store.getId(), LimitType.EMPLOYEE);

        Employee employee = EmployeeMapper.toStaffEntity(dto, branch, store);
        return EmployeeMapper.toDto(employeeRepository.save(employee));
    }

    @Override
    public EmployeeDto getEmployeeById(Long id, User currentUser) throws Exception {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            if (employee.getBranch() == null || !employee.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to view this employee");
            }
        } else if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(currentUser);
            if (!employee.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to view this employee");
            }
        }

        return EmployeeMapper.toDto(employee);
    }

    @Override
    public List<EmployeeDto> getStaffForCurrentUser(User currentUser) throws Exception {
        List<Employee> employees;

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            employees = employeeRepository.findByBranchIdAndUserIsNull(branch.getId());
        } else {
            Store store = getUserStore(currentUser);
            employees = employeeRepository.findByStoreIdAndUserIsNull(store.getId());
        }

        return employees.stream().map(EmployeeMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<EmployeeDto> getManagersForCurrentUser(User currentUser) throws Exception {
        if (!isAdminLike(currentUser)) {
            throw new Exception("Only Admin can view all branch managers");
        }
        Store store = getUserStore(currentUser);
        List<Employee> managers = employeeRepository.findByStoreIdAndUserRole(store.getId(), UserRole.ROLE_BRANCH_MANAGER);
        return managers.stream().map(EmployeeMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public EmployeeDto updateEmployee(Long id, EmployeeDto dto, User currentUser) throws Exception {
        Employee existing = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (existing.getUser() != null) {
            throw new Exception("This record has a login account — edit it from the Cashier/Manager section instead");
        }

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            if (existing.getBranch() == null || !existing.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to update this employee");
            }
        } else if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(currentUser);
            if (!existing.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to update this employee");
            }
        }

        if (dto.getFullName() != null) existing.setFullName(dto.getFullName());
        if (dto.getPhone() != null) existing.setPhone(dto.getPhone());
        if (dto.getDesignation() != null) existing.setDesignation(dto.getDesignation());
        if (dto.getSalary() != null) existing.setSalary(dto.getSalary());
        if (dto.getNotes() != null) existing.setNotes(dto.getNotes());
        if (dto.getIsActive() != null) existing.setIsActive(dto.getIsActive());
        if (dto.getJoiningDate() != null) existing.setJoiningDate(dto.getJoiningDate());

        return EmployeeMapper.toDto(employeeRepository.save(existing));
    }

    @Override
    public void deleteEmployee(Long id, User currentUser) throws Exception {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (employee.getUser() != null) {
            throw new Exception("This record has a login account — remove it from the Cashier/Manager section instead");
        }

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            if (employee.getBranch() == null || !employee.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to delete this employee");
            }
        } else if (currentUser.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(currentUser);
            if (!employee.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to delete this employee");
            }
        }

        employeeRepository.delete(employee);
    }


    @Override
    @org.springframework.transaction.annotation.Transactional
    public EmployeeDto updateManager(Long id, EmployeeDto dto, User currentUser) throws Exception {
        if (!isAdminLike(currentUser)) {
            throw new Exception("Only Admin can manage Branch Manager accounts");
        }
        Store store = getUserStore(currentUser);

        Employee manager = employeeRepository.findByIdAndStoreIdAndUserRole(id, store.getId(), UserRole.ROLE_BRANCH_MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("Branch Manager", "id", id));

        User user = manager.getUser();
        if (dto.getFullName() != null) { manager.setFullName(dto.getFullName()); user.setFullName(dto.getFullName()); }
        if (dto.getPhone() != null) { manager.setPhone(dto.getPhone()); user.setPhone(dto.getPhone()); }
        if (dto.getSalary() != null) manager.setSalary(dto.getSalary());
        if (dto.getIsActive() != null) manager.setIsActive(dto.getIsActive());
        user.setUpdatedAt(java.time.LocalDateTime.now());

        return EmployeeMapper.toDto(employeeRepository.save(manager));
    }

    @Override
    public void deleteManager(Long id, User currentUser) throws Exception {
        if (!isAdminLike(currentUser)) {
            throw new Exception("Only Admin can manage Branch Manager accounts");
        }
        Store store = getUserStore(currentUser);

        Employee manager = employeeRepository.findByIdAndStoreIdAndUserRole(id, store.getId(), UserRole.ROLE_BRANCH_MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("Branch Manager", "id", id));

        employeeRepository.delete(manager);
    }

}