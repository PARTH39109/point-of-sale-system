package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.RefundDto;
import com.parth.Point_of_sale_system.payload.dto.RefundRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface RefundService {
    RefundDto processRefund(RefundRequest request, User cashier) throws Exception;
    RefundDto getRefundById(Long id) throws Exception;
    RefundDto getRefundByRefundNumber(String refundNumber) throws Exception;
    List<RefundDto> getRefundsByOrderId(Long orderId) throws Exception;
    Page<RefundDto> getRefundsByStore(Long storeId, Pageable pageable);
    Page<RefundDto> getRefundsByDateRange(Long storeId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
