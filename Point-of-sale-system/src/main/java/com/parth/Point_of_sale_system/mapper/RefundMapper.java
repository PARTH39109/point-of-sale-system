package com.parth.Point_of_sale_system.mapper;

import com.parth.Point_of_sale_system.modal.Refund;
import com.parth.Point_of_sale_system.modal.RefundItem;
import com.parth.Point_of_sale_system.payload.dto.RefundDto;
import com.parth.Point_of_sale_system.payload.dto.RefundItemDto;

import java.util.List;
import java.util.stream.Collectors;

public class RefundMapper {

    public static RefundItemDto toItemDto(RefundItem item) {
        if (item == null) return null;
        return RefundItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .quantityRefunded(item.getQuantityRefunded())
                .unitPrice(item.getUnitPrice())
                .taxRefunded(item.getTaxRefunded())
                .discountRefunded(item.getDiscountRefunded())
                .refundAmount(item.getRefundAmount())
                .build();
    }

    public static RefundDto toDto(Refund refund) {
        if (refund == null) return null;

        List<RefundItemDto> itemDtos = null;
        if (refund.getRefundItems() != null) {
            itemDtos = refund.getRefundItems().stream()
                    .map(RefundMapper::toItemDto)
                    .collect(Collectors.toList());
        }

        return RefundDto.builder()
                .id(refund.getId())
                .refundNumber(refund.getRefundNumber())
                .orderId(refund.getOrder().getId())
                .orderNumber(refund.getOrder().getOrderNumber())
                .invoiceNumber(refund.getOrder().getInvoiceNumber())
                .paymentId(refund.getPayment() != null ? refund.getPayment().getId() : null)
                .refundedById(refund.getRefundedBy().getId())
                .refundedByName(refund.getRefundedBy().getFullName())
                .refundReason(refund.getRefundReason())
                .refundType(refund.getRefundType())
                .refundStatus(refund.getRefundStatus())
                .refundAmount(refund.getRefundAmount())
                .notes(refund.getNotes())
                .items(itemDtos)
                .createdAt(refund.getCreatedAt())
                .updatedAt(refund.getUpdatedAt())
                .build();
    }
}
