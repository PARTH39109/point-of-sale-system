package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.EmployeeDto;

import java.util.List;

public interface EmployeeService {
    EmployeeDto createEmployee(EmployeeDto employeeDto, User currentUser) throws Exception;
    EmployeeDto getEmployeeById(Long id, User currentUser) throws Exception;
    List<EmployeeDto> getStaffForCurrentUser(User currentUser) throws Exception;
    List<EmployeeDto> getManagersForCurrentUser(User currentUser) throws Exception;
    EmployeeDto updateEmployee(Long id, EmployeeDto employeeDto, User currentUser) throws Exception;
    void deleteEmployee(Long id, User currentUser) throws Exception;

    // Admin-only — edit/deactivate a Branch Manager's own User+Employee record
    EmployeeDto updateManager(Long id, EmployeeDto employeeDto, User currentUser) throws Exception;
    void deleteManager(Long id, User currentUser) throws Exception;
}