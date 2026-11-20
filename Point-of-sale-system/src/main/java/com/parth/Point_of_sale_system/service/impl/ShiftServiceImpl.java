package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.*;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.*;
import com.parth.Point_of_sale_system.payload.dto.*;
import com.parth.Point_of_sale_system.repository.*;
import com.parth.Point_of_sale_system.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ShiftServiceImpl implements ShiftService {

    private final ShiftRepository shiftRepository;
    private final EmployeeRepository employeeRepository;
    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final InventoryRepository inventoryRepository;

    private boolean isAdminLike(User user) {
        return user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_STORE_ADMIN;
    }

    private boolean isManagerLike(User user) {
        return user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_STORE_MANAGER;
    }

    private Store resolveAdminStore(User user) throws Exception {
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
        Employee employee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new Exception("No employee record found for this manager"));
        if (employee.getBranch() == null) throw new Exception("No branch associated with this manager");
        return employee.getBranch();
    }

    private Branch resolveCashierBranch(User user) throws Exception {
        Employee employee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new Exception("No employee record found for this cashier"));
        if (employee.getBranch() == null) throw new Exception("No branch associated with this cashier");
        return employee.getBranch();
    }

    private ShiftLabel inferShiftLabel(LocalDateTime now) {
        int h = now.getHour();
        if (h >= 5 && h < 12) return ShiftLabel.MORNING;
        if (h >= 12 && h < 17) return ShiftLabel.AFTERNOON;
        if (h >= 17 && h < 22) return ShiftLabel.EVENING;
        return ShiftLabel.NIGHT;
    }

    private String durationLabel(LocalDateTime start, LocalDateTime end) {
        if (start == null) return "-";
        LocalDateTime effectiveEnd = end != null ? end : LocalDateTime.now();
        Duration d = Duration.between(start, effectiveEnd);
        long hrs = d.toHours();
        long mins = d.toMinutesPart();
        return (end == null ? "Active (" : "") + hrs + "h " + mins + "m" + (end == null ? ")" : "");
    }

    private ShiftDto toDto(Shift shift) {
        LocalDateTime windowEnd = shift.getClosedAt() != null ? shift.getClosedAt() : LocalDateTime.now();
        List<Order> orders = orderRepository.findByCashierAndDateRange(shift.getCashier().getId(), shift.getOpenedAt(), windowEnd);
        long orderCount = orders.stream().filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED).count();
        double totalSales = orders.stream()
                .filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED)
                .mapToDouble(o -> o.getGrandTotal() != null ? o.getGrandTotal() : 0.0)
                .sum();

        return ShiftDto.builder()
                .id(shift.getId())
                .cashierId(shift.getCashier().getId())
                .cashierName(shift.getCashier().getFullName())
                .branchId(shift.getBranch().getId())
                .branchName(shift.getBranch().getName())
                .shiftLabel(shift.getShiftLabel())
                .status(shift.getStatus())
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .durationLabel(durationLabel(shift.getOpenedAt(), shift.getClosedAt()))
                .openingCash(shift.getOpeningCash())
                .closingCashActual(shift.getClosingCashActual())
                .orderCount(orderCount)
                .totalSales(totalSales)
                .build();
    }

    @Override
    public ShiftDto startShift(StartShiftRequest request, User currentUser) throws Exception {
        if (currentUser.getRole() != UserRole.ROLE_CASHIER) {
            throw new UserException("Only cashiers can start a shift");
        }
        if (shiftRepository.findByCashierIdAndStatus(currentUser.getId(), ShiftStatus.ACTIVE).isPresent()) {
            throw new UserException("You already have an active shift open");
        }

        Branch branch = resolveCashierBranch(currentUser);
        LocalDateTime now = LocalDateTime.now();

        Shift shift = Shift.builder()
                .cashier(currentUser)
                .branch(branch)
                .store(branch.getStore())
                .shiftLabel(request.getShiftLabel() != null ? request.getShiftLabel() : inferShiftLabel(now))
                .status(ShiftStatus.ACTIVE)
                .openingCash(request.getOpeningCash() != null ? request.getOpeningCash() : 0.0)
                .notes(request.getNotes())
                .openedAt(now)
                .build();

        return toDto(shiftRepository.save(shift));
    }

    @Override
    public ShiftDto endShift(Long shiftId, EndShiftRequest request, User currentUser) throws Exception {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        boolean isOwner = shift.getCashier().getId().equals(currentUser.getId());
        boolean isManagerOfBranch = isManagerLike(currentUser) &&
                shift.getBranch().getId().equals(resolveManagerBranch(currentUser).getId());

        if (!isOwner && !isManagerOfBranch && !isAdminLike(currentUser)) {
            throw new UserException("You are not authorized to close this shift");
        }
        if (shift.getStatus() == ShiftStatus.COMPLETED) {
            throw new UserException("This shift is already closed");
        }

        shift.setClosedAt(LocalDateTime.now());
        shift.setClosingCashActual(request.getClosingCashActual());
        shift.setNotes(request.getNotes());
        shift.setStatus(ShiftStatus.COMPLETED);

        return toDto(shiftRepository.save(shift));
    }

    @Override
    public ShiftDto getActiveShiftForCurrentUser(User currentUser) throws Exception {
        if (currentUser.getRole() != UserRole.ROLE_CASHIER) {
            return null;
        }
        return shiftRepository.findByCashierIdAndStatus(currentUser.getId(), ShiftStatus.ACTIVE)
                .map(this::toDto)
                .orElse(null);
    }

    @Override
    public List<ShiftDto> getShifts(User currentUser, LocalDate date, Long cashierIdFilter,
                                    Long branchIdFilter, String shiftLabelFilter, String statusFilter) throws Exception {
        LocalDateTime start;
        LocalDateTime end;
        if (date != null) {
            start = date.atStartOfDay();
            end = date.atTime(23, 59, 59);
        } else {
            start = LocalDate.now().minusDays(30).atStartOfDay();
            end = LocalDateTime.now();
        }

        List<Shift> shifts;

        if (currentUser.getRole() == UserRole.ROLE_CASHIER) {
            shifts = shiftRepository.findByCashierIdAndOpenedAtBetweenOrderByOpenedAtDesc(currentUser.getId(), start, end);
        } else if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            shifts = shiftRepository.findByBranchIdAndOpenedAtBetweenOrderByOpenedAtDesc(branch.getId(), start, end);
            if (cashierIdFilter != null) {
                shifts = shifts.stream().filter(s -> s.getCashier().getId().equals(cashierIdFilter)).collect(Collectors.toList());
            }
        } else if (isAdminLike(currentUser)) {
            Store store = resolveAdminStore(currentUser);
            shifts = shiftRepository.findByStoreIdAndOpenedAtBetweenOrderByOpenedAtDesc(store.getId(), start, end);
            if (branchIdFilter != null) {
                shifts = shifts.stream().filter(s -> s.getBranch().getId().equals(branchIdFilter)).collect(Collectors.toList());
            }
            if (cashierIdFilter != null) {
                shifts = shifts.stream().filter(s -> s.getCashier().getId().equals(cashierIdFilter)).collect(Collectors.toList());
            }
        } else {
            throw new UserException("You are not authorized to view shift reports");
        }

        if (shiftLabelFilter != null && !shiftLabelFilter.isBlank()) {
            ShiftLabel label = ShiftLabel.valueOf(shiftLabelFilter.trim().toUpperCase());
            shifts = shifts.stream().filter(s -> s.getShiftLabel() == label).collect(Collectors.toList());
        }
        if (statusFilter != null && !statusFilter.isBlank()) {
            ShiftStatus status = ShiftStatus.valueOf(statusFilter.trim().toUpperCase());
            shifts = shifts.stream().filter(s -> s.getStatus() == status).collect(Collectors.toList());
        }

        return shifts.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public ShiftKpiDto getKpis(User currentUser, LocalDate date, Long branchIdFilter) throws Exception {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.atTime(23, 59, 59);

        if (isManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            long activeShifts = shiftRepository.countByBranchIdAndStatus(branch.getId(), ShiftStatus.ACTIVE);
            Double totalSales = orderRepository.sumRevenueByBranchAndDateRange(branch.getId(), start, end);
            Long totalOrders = orderRepository.countOrdersByBranchAndDateRange(branch.getId(), start, end);
            Long cancelled = orderRepository.countCancelledOrdersByBranchAndDateRange(branch.getId(), start, end);
            Double paymentsCollected = paymentRepository.sumPaymentsByBranchAndDateRange(branch.getId(), start, end);

            return ShiftKpiDto.builder()
                    .activeShifts(activeShifts)
                    .cashiersOnShift(activeShifts) // one active shift per cashier, enforced on start
                    .totalSalesToday(totalSales != null ? totalSales : 0.0)
                    .totalOrders(totalOrders != null ? totalOrders : 0L)
                    .cancelledOrders(cancelled != null ? cancelled : 0L)
                    .totalPaymentsCollected(paymentsCollected != null ? paymentsCollected : 0.0)
                    .build();
        } else if (isAdminLike(currentUser)) {
            Store store = resolveAdminStore(currentUser);

            if (branchIdFilter != null) {
                long activeShifts = shiftRepository.countByBranchIdAndStatus(branchIdFilter, ShiftStatus.ACTIVE);
                Double totalSales = orderRepository.sumRevenueByBranchAndDateRange(branchIdFilter, start, end);
                Long totalOrders = orderRepository.countOrdersByBranchAndDateRange(branchIdFilter, start, end);
                Long cancelled = orderRepository.countCancelledOrdersByBranchAndDateRange(branchIdFilter, start, end);
                Double paymentsCollected = paymentRepository.sumPaymentsByBranchAndDateRange(branchIdFilter, start, end);
                return ShiftKpiDto.builder()
                        .activeShifts(activeShifts).cashiersOnShift(activeShifts)
                        .totalSalesToday(totalSales != null ? totalSales : 0.0)
                        .totalOrders(totalOrders != null ? totalOrders : 0L)
                        .cancelledOrders(cancelled != null ? cancelled : 0L)
                        .totalPaymentsCollected(paymentsCollected != null ? paymentsCollected : 0.0)
                        .build();
            }

            long activeShifts = shiftRepository.countByStoreIdAndStatus(store.getId(), ShiftStatus.ACTIVE);
            Double totalSales = orderRepository.sumRevenueByStoreAndDateRange(store.getId(), start, end);
            Long totalOrders = orderRepository.countOrdersByStoreAndDateRange(store.getId(), start, end);
            Long cancelled = orderRepository.countCancelledOrdersByStoreAndDateRange(store.getId(), start, end);
            Double paymentsCollected = paymentRepository.sumPaymentsByStoreAndDateRange(store.getId(), start, end);

            return ShiftKpiDto.builder()
                    .activeShifts(activeShifts).cashiersOnShift(activeShifts)
                    .totalSalesToday(totalSales != null ? totalSales : 0.0)
                    .totalOrders(totalOrders != null ? totalOrders : 0L)
                    .cancelledOrders(cancelled != null ? cancelled : 0L)
                    .totalPaymentsCollected(paymentsCollected != null ? paymentsCollected : 0.0)
                    .build();
        }

        throw new UserException("You are not authorized to view shift KPIs");
    }

    @Override
    public ShiftReportDto getShiftReport(Long shiftId, User currentUser) throws Exception {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        boolean isOwner = shift.getCashier().getId().equals(currentUser.getId());
        boolean isManagerOfBranch = isManagerLike(currentUser) &&
                shift.getBranch().getId().equals(resolveManagerBranch(currentUser).getId());
        boolean isAdminOfStore = isAdminLike(currentUser) &&
                shift.getStore().getId().equals(resolveAdminStore(currentUser).getId());

        if (!isOwner && !isManagerOfBranch && !isAdminOfStore) {
            throw new UserException("You are not authorized to view this shift report");
        }

        LocalDateTime start = shift.getOpenedAt();
        LocalDateTime end = shift.getClosedAt() != null ? shift.getClosedAt() : LocalDateTime.now();
        Long cashierId = shift.getCashier().getId();

        List<Order> orders = orderRepository.findByCashierAndDateRange(cashierId, start, end);
        List<Order> validOrders = orders.stream().filter(o -> o.getOrderStatus() != OrderStatus.CANCELLED).collect(Collectors.toList());
        long cancelledOrders = orders.size() - validOrders.size();

        double totalSales = validOrders.stream().mapToDouble(o -> o.getGrandTotal() != null ? o.getGrandTotal() : 0.0).sum();
        double totalDiscount = validOrders.stream().mapToDouble(o -> o.getDiscountAmount() != null ? o.getDiscountAmount() : 0.0).sum();
        int itemsSold = validOrders.stream().mapToInt(o -> o.getTotalQuantity() != null ? o.getTotalQuantity() : 0).sum();
        double avgBillValue = validOrders.isEmpty() ? 0.0 : totalSales / validOrders.size();

        // Payment breakdown
        List<Payment> payments = paymentRepository.findByCashierAndDateRange(cashierId, start, end);
        Map<String, Double> paymentMap = new LinkedHashMap<>();
        for (Payment p : payments) {
            String method = p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "OTHER";
            paymentMap.merge(method, p.getAmount() != null ? p.getAmount() : 0.0, Double::sum);
        }
        List<ShiftReportDto.PaymentBreakdownItem> paymentBreakdown = paymentMap.entrySet().stream()
                .map(e -> ShiftReportDto.PaymentBreakdownItem.builder().method(e.getKey()).amount(e.getValue()).build())
                .collect(Collectors.toList());

        double cashCollected = paymentMap.getOrDefault("CASH", 0.0);

        // Hourly sales
        Map<Integer, double[]> hourly = new TreeMap<>(); // hour -> [sales, count]
        for (Order o : validOrders) {
            int hour = o.getCreatedAt().getHour();
            double[] arr = hourly.computeIfAbsent(hour, k -> new double[]{0, 0});
            arr[0] += o.getGrandTotal() != null ? o.getGrandTotal() : 0.0;
            arr[1] += 1;
        }
        List<ShiftReportDto.HourlySalesPoint> hourlySales = hourly.entrySet().stream()
                .map(e -> ShiftReportDto.HourlySalesPoint.builder()
                        .hour(e.getKey()).sales(e.getValue()[0]).orderCount((long) e.getValue()[1]).build())
                .collect(Collectors.toList());

        // Top products
        Map<String, Long> productQty = new LinkedHashMap<>();
        for (Order o : validOrders) {
            for (OrderItem item : o.getOrderItems()) {
                String name = item.getProduct() != null ? item.getProduct().getName() : "Unknown";
                productQty.merge(name, item.getQuantity() != null ? item.getQuantity().longValue() : 0L, Long::sum);
            }
        }
        List<ShiftReportDto.TopProductItem> topProducts = productQty.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(10)
                .map(e -> ShiftReportDto.TopProductItem.builder().productName(e.getKey()).qtySold(e.getValue()).build())
                .collect(Collectors.toList());

        // Low stock (current snapshot) among products sold this shift
        Set<Long> soldProductIds = validOrders.stream()
                .flatMap(o -> o.getOrderItems().stream())
                .map(item -> item.getProduct() != null ? item.getProduct().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<ShiftReportDto.LowStockItem> lowStockItems = new ArrayList<>();
        for (Long productId : soldProductIds) {
            inventoryRepository.findByProductIdAndBranchId(productId, shift.getBranch().getId()).ifPresent(inv -> {
                if (inv.getQuantity() != null && inv.getMinStockLevel() != null && inv.getQuantity() <= inv.getMinStockLevel()) {
                    lowStockItems.add(ShiftReportDto.LowStockItem.builder()
                            .productName(inv.getProduct().getName())
                            .remaining(inv.getQuantity())
                            .minStockLevel(inv.getMinStockLevel())
                            .build());
                }
            });
        }

        // Returns / refunds
        List<Refund> refunds = refundRepository.findByCashierAndDateRange(cashierId, start, end);
        List<ShiftReportDto.ReturnItem> returnItems = refunds.stream()
                .map(r -> ShiftReportDto.ReturnItem.builder()
                        .billNumber(r.getOrder() != null ? r.getOrder().getOrderNumber() : "-")
                        .customerName(r.getOrder() != null && r.getOrder().getCustomer() != null ? r.getOrder().getCustomer().getName() : "Walk-in")
                        .amount(r.getRefundAmount())
                        .reason(r.getRefundReason())
                        .build())
                .collect(Collectors.toList());
        double returnsAmount = refunds.stream().mapToDouble(r -> r.getRefundAmount() != null ? r.getRefundAmount() : 0.0).sum();

        double openingCash = shift.getOpeningCash() != null ? shift.getOpeningCash() : 0.0;
        double expectedCash = openingCash + cashCollected;
        Double actualCash = shift.getClosingCashActual();
        Double cashDifference = actualCash != null ? (actualCash - expectedCash) : null;

        return ShiftReportDto.builder()
                .shiftId(shift.getId())
                .cashierName(shift.getCashier().getFullName())
                .branchName(shift.getBranch().getName())
                .shiftLabel(shift.getShiftLabel())
                .status(shift.getStatus())
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .totalOrders((long) validOrders.size())
                .cancelledOrders(cancelledOrders)
                .totalSales(totalSales)
                .totalDiscount(totalDiscount)
                .itemsSold(itemsSold)
                .averageBillValue(avgBillValue)
                .returnsCount((long) refunds.size())
                .returnsAmount(returnsAmount)
                .paymentBreakdown(paymentBreakdown)
                .hourlySales(hourlySales)
                .topProducts(topProducts)
                .lowStockItems(lowStockItems)
                .returns(returnItems)
                .openingCash(openingCash)
                .cashCollected(cashCollected)
                .expectedCash(expectedCash)
                .actualCash(actualCash)
                .cashDifference(cashDifference)
                .build();
    }
}