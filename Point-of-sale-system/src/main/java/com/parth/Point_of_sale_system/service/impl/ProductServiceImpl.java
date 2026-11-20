package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.DuplicateProductException;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.modal.*;
import com.parth.Point_of_sale_system.payload.dto.ProductDto;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.ProductService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.service.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository    productRepository;
    private final CategoryRepository   categoryRepository;
    private final StoreRepository      storeRepository;
    private final EmployeeRepository   employeeRepository;
    private final BranchRepository     branchRepository;
    private final SubscriptionService  subscriptionService;

    // ── Resolve store from user ──────────────────────────────────────────────
    private Store getUserStore(User user) {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) throw new RuntimeException("No store associated with this store admin");
            return store;
        }
        Store store = user.getStore();
        if (store == null) throw new RuntimeException("You are not associated with any store");
        return store;
    }

    // ── Resolve branch from user (Branch Managers AND Cashiers) ────────────
    private Branch getUserBranch(User user) {
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER
                || user.getRole() == UserRole.ROLE_CASHIER) {
            Employee emp = employeeRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("No employee record found for this user"));
            if (emp.getBranch() == null)
                throw new RuntimeException("You are not assigned to any branch");
            return emp.getBranch();
        }
        return null; // Store Admins / Super Admins have no fixed branch
    }

    // ── Composite-unique validation ───────────────────────────────────────────
    /**
     * Validates that no other product in the same branch already uses this
     * SKU or barcode.  Pass excludeId=null on create, existing product id on update.
     *
     * Because uniqueness is now (branch_id, sku) and (branch_id, barcode),
     * the same SKU/barcode is perfectly fine in a different branch.
     */
    private void validateBranchUniqueness(Long branchId, String sku, String barcode, Long excludeId) {
        if (sku != null && !sku.isBlank()) {
            productRepository.findByBranchIdAndSkuExcluding(branchId, sku, excludeId)
                    .ifPresent(existing -> {
                        throw new DuplicateProductException(
                                "A product with SKU '" + sku + "' already exists in this branch.");
                    });
        }
        if (barcode != null && !barcode.isBlank()) {
            productRepository.findByBranchIdAndBarcodeExcluding(branchId, barcode, excludeId)
                    .ifPresent(existing -> {
                        throw new DuplicateProductException(
                                "A product with barcode '" + barcode + "' already exists in this branch.");
                    });
        }
    }

    // ── CREATE ───────────────────────────────────────────────────────────────
    @Override
    public ProductDto createProduct(ProductDto productDto, User user) {
        Store store = getUserStore(user);
        subscriptionService.validateLimit(store.getId(), LimitType.PRODUCT);

        Category category = null;
        if (productDto.getCategoryId() != null) {
            category = categoryRepository.findById(productDto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", productDto.getCategoryId()));
        }

        // Branch Managers: auto-derive from their employee record.
        // Store Admins:   must supply branchId in the request body.
        Branch branch;
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER) {
            branch = getUserBranch(user);
        } else {
            if (productDto.getBranchId() == null)
                throw new RuntimeException("branchId is required when creating a product as Store Admin.");
            branch = branchRepository.findById(productDto.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", productDto.getBranchId()));
            // Make sure the branch belongs to the admin's store
            if (!branch.getStore().getId().equals(store.getId()))
                throw new RuntimeException("Branch does not belong to your store.");
        }

        // Friendly duplicate check before hitting the DB constraint
        validateBranchUniqueness(branch.getId(), productDto.getSku(), productDto.getBarcode(), null);

        Product product = ProductMapper.toEntity(productDto, category, store, branch);
        Product saved   = productRepository.save(product);
        return ProductMapper.toDto(saved);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────
    @Override
    public ProductDto updateProduct(Long id, ProductDto productDto, User user) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        Store store = getUserStore(user);

        // Store-level authorization
        if (user.getRole() != UserRole.ROLE_ADMIN
                && !existing.getStore().getId().equals(store.getId())) {
            throw new RuntimeException("Unauthorized to update this product");
        }

        // Branch Managers may only edit their own branch's products
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER) {
            Branch userBranch = getUserBranch(user);
            if (existing.getBranch() == null
                    || !existing.getBranch().getId().equals(userBranch.getId())) {
                throw new RuntimeException("Unauthorized: product does not belong to your branch");
            }
        }

        // Composite-unique check, excluding the product being updated
        Long branchId = existing.getBranch() != null ? existing.getBranch().getId() : null;
        if (branchId != null) {
            validateBranchUniqueness(branchId, productDto.getSku(), productDto.getBarcode(), id);
        }

        Category category = existing.getCategory();
        if (productDto.getCategoryId() != null) {
            category = categoryRepository.findById(productDto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", productDto.getCategoryId()));
        }

        existing.setName(productDto.getName());
        existing.setSku(productDto.getSku());
        existing.setBarcode(productDto.getBarcode());
        existing.setDescription(productDto.getDescription());
        existing.setPrice(productDto.getPrice());
        existing.setMrp(productDto.getMrp());
        existing.setSellingPrice(productDto.getSellingPrice());
        existing.setBrand(productDto.getBrand());
        existing.setImage(productDto.getImage());
        if (productDto.getUnit() != null && !productDto.getUnit().isBlank()) {
            existing.setUnit(productDto.getUnit());
        }
        existing.setCategory(category);
        existing.setTaxRate(productDto.getTaxRate() != null ? productDto.getTaxRate() : 0.0);
        if (productDto.getIsActive() != null) {
            existing.setIsActive(productDto.getIsActive());
        }

        Product updated = productRepository.save(existing);
        return ProductMapper.toDto(updated);
    }

    // ── DELETE (soft) ────────────────────────────────────────────────────────
    @Override
    public void deleteProduct(Long id, User user) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        Store store = getUserStore(user);
        if (user.getRole() != UserRole.ROLE_ADMIN
                && !existing.getStore().getId().equals(store.getId())) {
            throw new RuntimeException("Unauthorized to delete this product");
        }

        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER) {
            Branch userBranch = getUserBranch(user);
            if (existing.getBranch() == null
                    || !existing.getBranch().getId().equals(userBranch.getId())) {
                throw new RuntimeException("Unauthorized: product does not belong to your branch");
            }
        }

        // Soft-delete: preserves billing history references for cashier terminals
        existing.setIsActive(false);
        productRepository.save(existing);
    }

    // ── LIST — store-scoped (Store Admin / Super Admin) ──────────────────────
    @Override
    public List<ProductDto> getProductByStoreId(Long storeId) {
        return productRepository.findByStoreId(storeId)
                .stream().map(ProductMapper::toDto).collect(Collectors.toList());
    }

    // ── LIST — branch-aware primary method ───────────────────────────────────
    @Override
    public List<ProductDto> getProducts(User user) {
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER
                || user.getRole() == UserRole.ROLE_CASHIER) {
            Branch branch = getUserBranch(user);
            return productRepository.findByBranchId(branch.getId())
                    .stream().map(ProductMapper::toDto).collect(Collectors.toList());
        }
        Store store = getUserStore(user);
        return productRepository.findByStoreId(store.getId())
                .stream().map(ProductMapper::toDto).collect(Collectors.toList());
    }

    // ── SEARCH — store-scoped (legacy) ───────────────────────────────────────
    @Override
    public List<ProductDto> searchByKeyword(Long storeId, String keyword) {
        return productRepository.searchByKeyword(storeId, keyword)
                .stream().map(ProductMapper::toDto).collect(Collectors.toList());
    }

    // ── SEARCH — branch-aware primary method ─────────────────────────────────
    @Override
    public List<ProductDto> searchProducts(User user, String keyword) {
        if (user.getRole() == UserRole.ROLE_BRANCH_MANAGER
                || user.getRole() == UserRole.ROLE_CASHIER) {
            Branch branch = getUserBranch(user);
            return productRepository.searchByBranchAndKeyword(branch.getId(), keyword)
                    .stream().map(ProductMapper::toDto).collect(Collectors.toList());
        }
        Store store = getUserStore(user);
        return productRepository.searchByKeyword(store.getId(), keyword)
                .stream().map(ProductMapper::toDto).collect(Collectors.toList());
    }
}