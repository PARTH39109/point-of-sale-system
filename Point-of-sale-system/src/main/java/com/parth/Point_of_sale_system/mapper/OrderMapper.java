package com.parth.Point_of_sale_system.mapper;

import com.parth.Point_of_sale_system.modal.Order;
import com.parth.Point_of_sale_system.modal.OrderItem;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;
import com.parth.Point_of_sale_system.payload.dto.OrderItemDto;

import java.util.List;
import java.util.stream.Collectors;

public class OrderMapper {

    public static OrderItemDto toOrderItemDto(OrderItem item) {
        if (item == null) return null;
        
        return OrderItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discount(item.getDiscount())
                .tax(item.getTax())
                .lineTotal(item.getLineTotal())
                .build();
    }

    public static OrderDto toDto(Order order) {
        if (order == null) return null;

        List<OrderItemDto> items = null;
        if (order.getOrderItems() != null) {
            items = order.getOrderItems().stream()
                    .map(OrderMapper::toOrderItemDto)
                    .collect(Collectors.toList());
        }

        return OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .invoiceNumber(order.getInvoiceNumber())
                .storeId(order.getStore().getId())
                .branchId(order.getBranch() != null ? order.getBranch().getId() : null)
                .cashierId(order.getCashier().getId())
                .cashierName(order.getCashier().getFullName())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                .items(items)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .discountType(order.getDiscountType())
                .taxAmount(order.getTaxAmount())
                .grandTotal(order.getGrandTotal())
                .totalItems(order.getTotalItems())
                .totalQuantity(order.getTotalQuantity())
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getOrderStatus())
                .paymentMethod(order.getPaymentMethod())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
