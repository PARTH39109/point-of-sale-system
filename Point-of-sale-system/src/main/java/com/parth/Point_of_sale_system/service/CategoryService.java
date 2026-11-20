package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CategoryDto;

import java.util.List;

public interface CategoryService {
    CategoryDto createCategory(CategoryDto categoryDto, User user) throws Exception;
    CategoryDto getCategoryById(Long id, User user) throws Exception;

    // branchIdFilter is Admin-only (optional); ignored for Branch Manager, who always sees just their own branch
    List<CategoryDto> getCategoriesForCurrentUser(User user, Long branchIdFilter) throws Exception;

    CategoryDto updateCategory(Long id, CategoryDto categoryDto, User user) throws Exception;
    void deleteCategory(Long id, User user) throws Exception;
}