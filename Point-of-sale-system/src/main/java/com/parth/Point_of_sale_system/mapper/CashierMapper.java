package com.parth.Point_of_sale_system.mapper;

import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CashierDto;

public class CashierMapper {

    public static CashierDto toDto(Employee employee) {
        if (employee == null) return null;

        User user = employee.getUser();
        Branch branch = employee.getBranch();

        return CashierDto.builder()
                .id(employee.getId())
                .userId(user != null ? user.getId() : null)
                .fullName(employee.getFullName())
                .email(user != null ? user.getEmail() : null)
                .phone(employee.getPhone())
                .salary(employee.getSalary())
                .isActive(employee.getIsActive())
                .joiningDate(employee.getJoiningDate())
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .storeId(employee.getStore() != null ? employee.getStore().getId() : null)
                .createdAt(employee.getCreatedAt())
                .build();
    }
}