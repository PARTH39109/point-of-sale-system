package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.OrderStatus;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
import com.parth.Point_of_sale_system.domain.StockMovementType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.domain.ShiftStatus;
import org.springframework.security.access.AccessDeniedException;
import com.parth.Point_of_sale_system.mapper.OrderMapper;
import com.parth.Point_of_sale_system.modal.*;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;
import com.parth.Point_of_sale_system.payload.dto.OrderRequest;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.OrderService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final BranchRepository branchRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final EmployeeRepository employeeRepository;
    private final SubscriptionService subscriptionService;
    private final ShiftRepository shiftRepository;

    private Store resolveStore(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) throw new Exception("No store associated with this admin");
            return store;
        }
        Store store = user.getStore();
        if (store == null) throw new Exception("You are not associated with any store");
        return store;
    }

    private String generateOrderNumber() {
        // e.g., ORD-20260706-000001
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = orderRepository.count() + 1; // Basic generation, in prod use sequence or UUID
        return String.format("ORD-%s-%06d", dateStr, count);
    }

    private String generateInvoiceNumber() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = orderRepository.count() + 1;
        return String.format("INV-%s-%06d", dateStr, count);
    }

    @Override
    @Transactional(rollbackFor = Exception.class, readOnly = false)
    public OrderDto createOrder(OrderRequest request, User cashier) throws Exception {
        // 1. Validate cashier shift status
        if (cashier.getRole() == UserRole.ROLE_CASHIER) {
            shiftRepository.findByCashierIdAndStatus(cashier.getId(), ShiftStatus.ACTIVE)
                    .orElseThrow(() -> new AccessDeniedException("Shift not active. Please start a shift first."));
        }

        // 2. Validate Store
        Store store = resolveStore(cashier);

        // Validate subscription limit
        subscriptionService.validateLimit(store.getId(), LimitType.ORDER);

        // 2. Validate Branch
        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new Exception("Branch not found"));
            if (!branch.getStore().getId().equals(store.getId())) {
                throw new Exception("Branch does not belong to this store");
            }
        } else {
            // Try to resolve branch from employee record
            Optional<Employee> employeeOpt = employeeRepository.findByUserId(cashier.getId());
            if (employeeOpt.isPresent() && employeeOpt.get().getBranch() != null) {
                branch = employeeOpt.get().getBranch();
            } else {
                throw new Exception("A branch must be specified or the cashier must be assigned to a branch");
            }
        }

        // 3. Validate Customer (Optional)
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new Exception("Customer not found"));
            if (!customer.getStore().getId().equals(store.getId())) {
                throw new Exception("Customer does not belong to this store");
            }
        }

        // 4. Create Order shell
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setInvoiceNumber(generateInvoiceNumber());
        order.setStore(store);
        order.setBranch(branch);
        order.setCashier(cashier);
        order.setCustomer(customer);
        order.setSubtotal(request.getSubtotal());
        order.setDiscountAmount(request.getDiscountAmount());
        order.setDiscountType(request.getDiscountType());
        order.setTaxAmount(request.getTaxAmount());
        order.setGrandTotal(request.getGrandTotal());
        order.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : PaymentStatus.PAID);
        order.setOrderStatus(OrderStatus.COMPLETED); // POS assumes immediate completion usually
        order.setPaymentMethod(request.getPaymentMethod());
        order.setNotes(request.getNotes());

        int totalQuantity = 0;
        int totalItems = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        // 5. Process Items, Validate Stock, Deduct Inventory
        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new Exception("Product not found: " + itemReq.getProductId()));

            if (!product.getIsActive()) {
                throw new Exception("Product is not active: " + product.getName());
            }

            // Find Inventory for this branch
            Inventory inventory = inventoryRepository.findByProductIdAndBranchId(product.getId(), branch.getId())
                    .orElseThrow(() -> new Exception("Inventory record not found for product: " + product.getName()));

            // Prevent negative inventory
            if (inventory.getQuantity() < itemReq.getQuantity()) {
                throw new Exception("Insufficient stock for product: " + product.getName() +
                        ". Available: " + inventory.getQuantity() + ", Requested: " + itemReq.getQuantity());
            }

            // Deduct Inventory
            inventory.setQuantity(inventory.getQuantity() - itemReq.getQuantity());
            inventoryRepository.save(inventory);

            // Record Stock Movement
            StockMovement movement = new StockMovement();
            movement.setInventory(inventory);
            movement.setType(StockMovementType.OUT);
            movement.setQuantity(itemReq.getQuantity());
            movement.setReason("Order " + order.getOrderNumber());
            movement.setPerformedBy(cashier);
            stockMovementRepository.save(movement);

            // Create OrderItem
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(itemReq.getUnitPrice());
            orderItem.setDiscount(itemReq.getDiscount());
            orderItem.setTax(itemReq.getTax());

            Double lineTotal = (itemReq.getUnitPrice() * itemReq.getQuantity()) - (itemReq.getDiscount() != null ? itemReq.getDiscount() : 0) + (itemReq.getTax() != null ? itemReq.getTax() : 0);
            orderItem.setLineTotal(lineTotal);

            orderItems.add(orderItem);

            totalQuantity += itemReq.getQuantity();
            totalItems++;
        }

        order.setOrderItems(orderItems);
        order.setTotalItems(totalItems);
        order.setTotalQuantity(totalQuantity);

        // Save order and cascade save items
        Order savedOrder = orderRepository.save(order);

        return OrderMapper.toDto(savedOrder);
    }

    @Override
    public OrderDto getOrderById(Long id, User user) throws Exception {
        Store store = resolveStore(user);
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new Exception("Order not found"));
        if (!order.getStore().getId().equals(store.getId())) {
            throw new Exception("Unauthorized access to this order");
        }
        return OrderMapper.toDto(order);
    }

    @Override
    public OrderDto getOrderByOrderNumber(String orderNumber, User user) throws Exception {
        Store store = resolveStore(user);
        Order order = orderRepository.findByOrderNumberWithItems(orderNumber)
                .orElseThrow(() -> new Exception("Order not found"));
        if (!order.getStore().getId().equals(store.getId())) {
            throw new Exception("Unauthorized access to this order");
        }
        return OrderMapper.toDto(order);
    }

    @Override
    @Transactional(readOnly = false)
    public OrderDto updateOrderStatus(Long id, OrderStatus status, User user) throws Exception {
        Store store = resolveStore(user);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new Exception("Order not found"));
        if (!order.getStore().getId().equals(store.getId())) {
            throw new Exception("Unauthorized access to this order");
        }

        order.setOrderStatus(status);
        return OrderMapper.toDto(orderRepository.save(order));
    }

    @Override
    public Page<OrderDto> getOrdersByStore(Long storeId, Pageable pageable) {
        return orderRepository.findByStoreIdWithItems(storeId, pageable).map(OrderMapper::toDto);
    }

    @Override
    public Page<OrderDto> getOrdersByBranch(Long branchId, Pageable pageable) {
        return orderRepository.findByBranchIdWithItems(branchId, pageable).map(OrderMapper::toDto);
    }

    @Override
    public Page<OrderDto> getOrdersByCustomer(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable).map(OrderMapper::toDto);
    }

    @Override
    public Page<OrderDto> getOrdersByDateRange(Long storeId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return orderRepository.findByDateRange(storeId, start, end, pageable).map(OrderMapper::toDto);
    }

    @Override
    @Transactional(readOnly = false)
    public void linkCustomerToOrder(Long orderId, Long customerId, User user) throws Exception {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new Exception("Order not found: " + orderId));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new Exception("Customer not found: " + customerId));
        order.setCustomer(customer);
        orderRepository.save(order);
    }

}