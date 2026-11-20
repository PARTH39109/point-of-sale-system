package com.parth.Point_of_sale_system.service;

import com.parth.Point_of_sale_system.domain.OrderStatus;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;
import com.parth.Point_of_sale_system.payload.dto.OrderRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface OrderService {
    OrderDto createOrder(OrderRequest request, User cashier) throws Exception;

    OrderDto getOrderById(Long id, User user) throws Exception;

    OrderDto getOrderByOrderNumber(String orderNumber, User user) throws Exception;

    OrderDto updateOrderStatus(Long id, OrderStatus status, User user) throws Exception;

    Page<OrderDto> getOrdersByStore(Long storeId, Pageable pageable);

    Page<OrderDto> getOrdersByBranch(Long branchId, Pageable pageable);

    Page<OrderDto> getOrdersByCustomer(Long customerId, Pageable pageable);

    Page<OrderDto> getOrdersByDateRange(Long storeId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    void linkCustomerToOrder(Long orderId, Long customerId, User user) throws Exception;
}