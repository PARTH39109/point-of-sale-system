package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.domain.StockMovementType;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.InventoryDto;
import com.parth.Point_of_sale_system.payload.dto.StockMovementDto;

import java.util.List;

public interface InventoryService {
    InventoryDto addOrUpdateStock(Long productId, Long branchId, Integer quantity, StockMovementType type, String reason, Integer minStockLevel, Integer maxStockLevel, User user) throws Exception;
    InventoryDto getInventoryByProductAndBranch(Long productId, Long branchId, User user) throws Exception;
    List<InventoryDto> getInventoryByBranch(Long branchId, User user) throws Exception;
    List<InventoryDto> getLowStockAlerts(Long branchId, User user) throws Exception;

    // Self-service variants for Branch Managers/Cashiers hitting /api/inventory/me*.
    // branchId here is resolved directly from the caller's own Employee record,
    // so it's already trusted — no additional storeId cross-check is needed
    // (and, per design, must NOT be applied for this path).
    List<InventoryDto> getInventoryForOwnBranch(Long branchId) throws Exception;
    List<InventoryDto> getLowStockForOwnBranch(Long branchId) throws Exception;
    List<StockMovementDto> getStockMovements(Long branchId, User user) throws Exception;
}