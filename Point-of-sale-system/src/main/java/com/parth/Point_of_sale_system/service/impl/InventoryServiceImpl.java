package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.StockMovementType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.modal.*;
import com.parth.Point_of_sale_system.payload.dto.InventoryDto;
import com.parth.Point_of_sale_system.payload.dto.StockMovementDto;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.InventoryService;
import com.parth.Point_of_sale_system.service.mapper.InventoryMapper;
import com.parth.Point_of_sale_system.service.mapper.StockMovementMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;

    private Store getUserStore(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) {
                throw new Exception("No store associated with this store admin");
            }
            return store;
        } else {
            Store store = user.getStore();
            if (store == null) {
                throw new Exception("You are not associated with any store");
            }
            return store;
        }
    }

    private void verifyBranchAccess(Long branchId, User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_ADMIN) return;
        Store store = getUserStore(user);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));
        if (!branch.getStore().getId().equals(store.getId())) {
            throw new Exception("Unauthorized access to this branch");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InventoryDto addOrUpdateStock(Long productId, Long branchId, Integer quantity, StockMovementType type, String reason, Integer minStockLevel, Integer maxStockLevel, User user) throws Exception {
        verifyBranchAccess(branchId, user);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));

        Inventory inventory = inventoryRepository.findByProductIdAndBranchId(productId, branchId)
                .orElseGet(() -> {
                    Inventory inv = new Inventory();
                    inv.setProduct(product);
                    inv.setBranch(branch);
                    inv.setQuantity(0);
                    inv.setMinStockLevel(10);
                    inv.setMaxStockLevel(100);
                    return inv;
                });

        int originalQty = inventory.getQuantity();
        int finalQty = originalQty;

        if (type == StockMovementType.IN || type == StockMovementType.RETURN) {
            finalQty += quantity;
            if (type == StockMovementType.IN) {
                inventory.setLastRestockedAt(LocalDateTime.now());
            }
        } else if (type == StockMovementType.OUT) {
            finalQty -= quantity;
        } else if (type == StockMovementType.ADJUSTMENT) {
            finalQty = quantity;
        }

        if (finalQty < 0) {
            throw new Exception("Insufficient stock level for this branch operation. Current stock: " + originalQty);
        }

        inventory.setQuantity(finalQty);
        if (minStockLevel != null) {
            inventory.setMinStockLevel(minStockLevel);
        }
        if (maxStockLevel != null) {
            inventory.setMaxStockLevel(maxStockLevel);
        }
        Inventory savedInventory = inventoryRepository.save(inventory);

        // Record stock movement audit trail
        StockMovement movement = StockMovement.builder()
                .inventory(savedInventory)
                .type(type)
                .quantity(quantity)
                .reason(reason)
                .performedBy(user)
                .build();
        stockMovementRepository.save(movement);

        return InventoryMapper.toDto(savedInventory);
    }

    @Override
    public InventoryDto getInventoryByProductAndBranch(Long productId, Long branchId, User user) throws Exception {
        verifyBranchAccess(branchId, user);
        Inventory inventory = inventoryRepository.findByProductIdAndBranchId(productId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product", "branch", branchId));
        return InventoryMapper.toDto(inventory);
    }

    @Override
    public List<InventoryDto> getInventoryByBranch(Long branchId, User user) throws Exception {
        verifyBranchAccess(branchId, user);
        List<Inventory> inventoryList = inventoryRepository.findByBranchId(branchId);
        return inventoryList.stream().map(InventoryMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<InventoryDto> getLowStockAlerts(Long branchId, User user) throws Exception {
        verifyBranchAccess(branchId, user);
        List<Inventory> inventoryList = inventoryRepository.findLowStockByBranchId(branchId);
        return inventoryList.stream().map(InventoryMapper::toDto).collect(Collectors.toList());
    }

    // ── Self-service (Branch Manager / Cashier via /api/inventory/me*) ─────────
    // branchId is already resolved from the caller's own Employee.branch, so it
    // is trusted as-is. Deliberately skips verifyBranchAccess: that helper
    // re-derives the store via user.getStore() and cross-checks
    // branch.getStore().getId() against it, which is unnecessary here and was
    // the source of the branch manager's Low Stock page silently returning
    // nothing. This mirrors the branch-resolution pattern already used
    // successfully by BranchAnalyticsServiceImpl.
    @Override
    public List<InventoryDto> getInventoryForOwnBranch(Long branchId) throws Exception {
        List<Inventory> inventoryList = inventoryRepository.findByBranchId(branchId);
        return inventoryList.stream().map(InventoryMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<InventoryDto> getLowStockForOwnBranch(Long branchId) throws Exception {
        List<Inventory> inventoryList = inventoryRepository.findLowStockByBranchId(branchId);
        return inventoryList.stream().map(InventoryMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public List<StockMovementDto> getStockMovements(Long branchId, User user) throws Exception {
        verifyBranchAccess(branchId, user);
        List<StockMovement> movements = stockMovementRepository.findByBranchId(branchId);
        return movements.stream().map(StockMovementMapper::toDto).collect(Collectors.toList());
    }
}