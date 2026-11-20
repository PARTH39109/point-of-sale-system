package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CategoryDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.service.CategoryService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/category")
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(
            @RequestBody CategoryDto categoryDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(categoryService.createCategory(categoryDto, user));
    }

    // Admin-only: ?branchId=5 narrows the cross-branch view to one branch
    @GetMapping
    public ResponseEntity<List<CategoryDto>> getCategories(
            @RequestParam(required = false) Long branchId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(categoryService.getCategoriesForCurrentUser(user, branchId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> getCategoryById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(categoryService.getCategoryById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryDto categoryDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(categoryService.updateCategory(id, categoryDto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCategory(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        categoryService.deleteCategory(id, user);
        return ResponseEntity.ok(new ApiResponse("Category deleted successfully", true));
    }
}