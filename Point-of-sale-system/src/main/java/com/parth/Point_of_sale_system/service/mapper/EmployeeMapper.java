package com.parth.Point_of_sale_system.service.mapper;

import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.EmployeeDto;

public class EmployeeMapper {

    public static EmployeeDto toDto(Employee employee) {
        if (employee == null) {
            return null;
        }

        User user = employee.getUser();
        Branch branch = employee.getBranch();

        return EmployeeDto.builder()
                .id(employee.getId())
                // Fallback to the linked user's name/phone only for legacy rows that
                // predate this redesign — new rows always carry these on Employee itself.
                .fullName(employee.getFullName() != null ? employee.getFullName() : (user != null ? user.getFullName() : null))
                .phone(employee.getPhone() != null ? employee.getPhone() : (user != null ? user.getPhone() : null))
                .designation(employee.getDesignation())
                .salary(employee.getSalary())
                .joiningDate(employee.getJoiningDate())
                .notes(employee.getNotes())
                .isActive(employee.getIsActive())
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .storeId(employee.getStore() != null ? employee.getStore().getId() : null)
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .userId(user != null ? user.getId() : null)
                .email(user != null ? user.getEmail() : null)
                .role(user != null ? user.getRole() : null)
                .hasLogin(user != null)
                .build();
    }

    // Staff-only creation — no User is created or linked here.
    public static Employee toStaffEntity(EmployeeDto dto, Branch branch, Store store) {
        if (dto == null) {
            return null;
        }

        return Employee.builder()
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .branch(branch)
                .store(store)
                .designation(dto.getDesignation())
                .salary(dto.getSalary())
                .notes(dto.getNotes())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .joiningDate(dto.getJoiningDate())
                .build();
    }
}