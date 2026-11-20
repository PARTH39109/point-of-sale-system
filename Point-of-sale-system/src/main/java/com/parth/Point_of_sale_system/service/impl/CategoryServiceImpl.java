package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Category;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.CategoryDto;
import com.parth.Point_of_sale_system.repository.BranchRepository;
import com.parth.Point_of_sale_system.repository.CategoryRepository;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.ProductRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.service.CategoryService;
import com.parth.Point_of_sale_system.service.mapper.CategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;

    private boolean isAdmin(User user) {
        return user.getRole() == UserRole.ROLE_ADMIN;
    }

    private boolean isManagerLike(User user) {
        return user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_STORE_MANAGER;
    }

    // Read-only scope: Cashiers can VIEW their branch's categories (needed for
    // the POS terminal) but cannot create/update/delete them — those stay
    // gated behind isManagerLike(). This was the bug: Cashiers weren't
    // recognized as branch-scoped at all, so they fell through to the
    // store-wide (all-branches) category list below.
    private boolean isBranchScopedReader(User user) {
        return isManagerLike(user) || user.getRole() == UserRole.ROLE_CASHIER;
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

    private CategoryDto toDtoWithCount(Category category) {
        Long count = productRepository.countByCategoryId(category.getId());
        return CategoryMapper.toDto(category, count);
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryDto dto, User user) throws Exception {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new Exception("Category name is required");
        }

        Branch branch;
        if (isManagerLike(user)) {
            branch = resolveManagerBranch(user);
        } else if (isAdmin(user)) {
            if (dto.getBranchId() == null) {
                throw new Exception("Please select a branch for this category");
            }
            branch = branchRepository.findById(dto.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", dto.getBranchId()));
        } else {
            throw new Exception("You are not authorized to create categories");
        }

        Store store = branch.getStore();
        Category category = CategoryMapper.toEntity(dto, store, branch);
        return toDtoWithCount(categoryRepository.save(category));
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id, User user) throws Exception {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (isBranchScopedReader(user)) {
            Branch branch = resolveManagerBranch(user);
            if (!category.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized access to this category");
            }
        } else if (!isAdmin(user)) {
            Store store = getUserStore(user);
            if (!category.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized access to this category");
            }
        }

        return toDtoWithCount(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategoriesForCurrentUser(User user, Long branchIdFilter) throws Exception {
        List<Category> categories;

        if (isBranchScopedReader(user)) {
            Branch branch = resolveManagerBranch(user);
            categories = categoryRepository.findByBranchId(branch.getId());
        } else if (isAdmin(user)) {
            Store store = getUserStore(user);
            categories = (branchIdFilter != null)
                    ? categoryRepository.findByStoreIdAndBranchId(store.getId(), branchIdFilter)
                    : categoryRepository.findByStoreId(store.getId());
        } else {
            Store store = getUserStore(user);
            categories = (branchIdFilter != null)
                    ? categoryRepository.findByStoreIdAndBranchId(store.getId(), branchIdFilter)
                    : categoryRepository.findByStoreId(store.getId());
        }

        return categories.stream().map(this::toDtoWithCount).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Long id, CategoryDto dto, User user) throws Exception {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (isManagerLike(user)) {
            Branch branch = resolveManagerBranch(user);
            if (!existing.getBranch().getId().equals(branch.getId())) {
                throw new Exception("Unauthorized to update this category");
            }
        } else if (!isAdmin(user)) {
            Store store = getUserStore(user);
            if (!existing.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to update this category");
            }
        }

        existing.setName(dto.getName());
        existing.setDescription(dto.getDescription());
        existing.setImageUrl(dto.getImageUrl());
        if (dto.getIsActive() != null) {
            existing.setIsActive(dto.getIsActive());
        }

        return toDtoWithCount(categoryRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id, User user) throws Exception {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (isManagerLike(user)) {
            Branch branch = resolveManagerBranch(user);
            if (!category.getBranch().getId().equals(branch.getId())) {
                throw new UserException("Unauthorized to delete this category");
            }
        } else if (!isAdmin(user)) {
            Store store = getUserStore(user);
            if (!category.getStore().getId().equals(store.getId())) {
                throw new UserException("Unauthorized to delete this category");
            }
        }

        long productCount = productRepository.countByCategoryId(category.getId());
        if (productCount > 0) {
            throw new UserException("Cannot delete category because products are assigned to it.");
        }

        // Permanent delete — no soft-delete flag
        categoryRepository.delete(category);
    }
}