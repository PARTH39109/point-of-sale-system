package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.OrderStatus;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
import com.parth.Point_of_sale_system.domain.RefundStatus;
import com.parth.Point_of_sale_system.domain.StockMovementType;
import com.parth.Point_of_sale_system.mapper.RefundMapper;
import com.parth.Point_of_sale_system.modal.*;
import com.parth.Point_of_sale_system.payload.dto.RefundDto;
import com.parth.Point_of_sale_system.payload.dto.RefundRequest;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.RefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;

    private String generateRefundNumber() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = refundRepository.count() + 1;
        return String.format("REF-%s-%06d", dateStr, count);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RefundDto processRefund(RefundRequest request, User cashier) throws Exception {
        // 1. Validate Order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new Exception("Order not found: " + request.getOrderId()));

        // 2. Validate Order is paid / processing (partially paid)
        if (order.getPaymentStatus() == PaymentStatus.PENDING || order.getPaymentStatus() == PaymentStatus.FAILED) {
            throw new Exception("Cannot process refund on unpaid or failed orders.");
        }

        // Calculate total previously refunded amount
        Double totalPreviouslyRefunded = refundRepository.sumRefundedAmountByOrderId(order.getId());
        if (totalPreviouslyRefunded == null) totalPreviouslyRefunded = 0.0;

        // Calculate remaining refundable amount
        double remainingRefundable = order.getGrandTotal() - totalPreviouslyRefunded;
        if (remainingRefundable <= 0.01) {
            throw new Exception("This order has already been fully refunded.");
        }

        // Process request amount sum
        double requestRefundAmount = 0.0;
        List<RefundItem> refundItems = new ArrayList<>();

        Refund refund = Refund.builder()
                .refundNumber(generateRefundNumber())
                .order(order)
                .refundedBy(cashier)
                .refundReason(request.getRefundReason())
                .refundType(request.getRefundType())
                .refundStatus(RefundStatus.COMPLETED)
                .notes(request.getNotes())
                .build();

        // 3. Item-wise validation and inventory restoration
        for (RefundRequest.RefundItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new Exception("Product not found: " + itemReq.getProductId()));

            // Find matching original OrderItem to check purchased quantities
            OrderItem originalItem = order.getOrderItems().stream()
                    .filter(oi -> oi.getProduct().getId().equals(product.getId()))
                    .findFirst()
                    .orElseThrow(() -> new Exception("Product " + product.getName() + " does not belong to this order."));

            // Sum up previously refunded quantity for this product in this order
            int alreadyRefundedQty = 0;
            List<Refund> completedRefunds = refundRepository.findByOrderId(order.getId());
            for (Refund prevRefund : completedRefunds) {
                if (prevRefund.getRefundStatus() == RefundStatus.COMPLETED) {
                    for (RefundItem prevItem : prevRefund.getRefundItems()) {
                        if (prevItem.getProduct().getId().equals(product.getId())) {
                            alreadyRefundedQty += prevItem.getQuantityRefunded();
                        }
                    }
                }
            }

            int totalRequestedQty = alreadyRefundedQty + itemReq.getQuantityRefunded();
            if (totalRequestedQty > originalItem.getQuantity()) {
                throw new Exception(String.format(
                        "Cannot refund %d units of %s. Original purchase: %d, Already refunded: %d",
                        itemReq.getQuantityRefunded(), product.getName(), originalItem.getQuantity(), alreadyRefundedQty));
            }

            // Restore stock to branch inventory
            if (order.getBranch() != null) {
                Inventory inventory = inventoryRepository.findByProductIdAndBranchId(product.getId(), order.getBranch().getId())
                        .orElseThrow(() -> new Exception("Inventory record not found at branch for " + product.getName()));
                
                inventory.setQuantity(inventory.getQuantity() + itemReq.getQuantityRefunded());
                inventoryRepository.save(inventory);

                // Record stock movement (type=RETURN)
                StockMovement movement = StockMovement.builder()
                        .inventory(inventory)
                        .type(StockMovementType.RETURN)
                        .quantity(itemReq.getQuantityRefunded())
                        .reason("Refund " + refund.getRefundNumber())
                        .performedBy(cashier)
                        .build();
                stockMovementRepository.save(movement);
            }

            // Create refund item record
            RefundItem refundItem = RefundItem.builder()
                    .refund(refund)
                    .product(product)
                    .quantityRefunded(itemReq.getQuantityRefunded())
                    .unitPrice(itemReq.getUnitPrice())
                    .taxRefunded(itemReq.getTaxRefunded() != null ? itemReq.getTaxRefunded() : 0.0)
                    .discountRefunded(itemReq.getDiscountRefunded() != null ? itemReq.getDiscountRefunded() : 0.0)
                    .refundAmount(itemReq.getRefundAmount())
                    .build();

            refundItems.add(refundItem);
            requestRefundAmount += itemReq.getRefundAmount();
        }

        // Validate over-refund on amount
        if (requestRefundAmount > remainingRefundable + 0.01) {
            throw new Exception(String.format(
                    "Refund amount (INR %.2f) exceeds remaining refundable balance (INR %.2f)",
                    requestRefundAmount, remainingRefundable));
        }

        refund.setRefundItems(refundItems);
        refund.setRefundAmount(requestRefundAmount);

        // Save Refund leg
        Refund savedRefund = refundRepository.save(refund);

        // 4. Update Order and Payment Statuses based on cumulative refunded amounts
        double totalRefundedCumulative = totalPreviouslyRefunded + requestRefundAmount;

        if (totalRefundedCumulative >= order.getGrandTotal() - 0.01) {
            order.setOrderStatus(OrderStatus.REFUNDED);
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        } else {
            order.setOrderStatus(OrderStatus.PARTIALLY_REFUNDED);
            order.setPaymentStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }
        orderRepository.save(order);

        return RefundMapper.toDto(savedRefund);
    }

    @Override
    public RefundDto getRefundById(Long id) throws Exception {
        Refund refund = refundRepository.findById(id)
                .orElseThrow(() -> new Exception("Refund record not found: " + id));
        return RefundMapper.toDto(refund);
    }

    @Override
    public RefundDto getRefundByRefundNumber(String refundNumber) throws Exception {
        Refund refund = refundRepository.findByRefundNumber(refundNumber)
                .orElseThrow(() -> new Exception("Refund record not found: " + refundNumber));
        return RefundMapper.toDto(refund);
    }

    @Override
    public List<RefundDto> getRefundsByOrderId(Long orderId) throws Exception {
        return refundRepository.findByOrderId(orderId).stream()
                .map(RefundMapper::toDto)
                .toList();
    }

    @Override
    public Page<RefundDto> getRefundsByStore(Long storeId, Pageable pageable) {
        return refundRepository.findByOrderStoreId(storeId, pageable).map(RefundMapper::toDto);
    }

    @Override
    public Page<RefundDto> getRefundsByDateRange(Long storeId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return refundRepository.findByStoreAndDateRange(storeId, start, end, pageable).map(RefundMapper::toDto);
    }
}
