package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.PaymentMethod;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
import com.parth.Point_of_sale_system.gateway.GatewayResponse;
import com.parth.Point_of_sale_system.gateway.impl.RazorpayGateway;
import com.parth.Point_of_sale_system.gateway.impl.StripeGateway;
import com.parth.Point_of_sale_system.mapper.PaymentMapper;
import com.parth.Point_of_sale_system.modal.Order;
import com.parth.Point_of_sale_system.modal.Payment;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.PaymentDto;
import com.parth.Point_of_sale_system.payload.dto.PaymentRequest;
import com.parth.Point_of_sale_system.repository.OrderRepository;
import com.parth.Point_of_sale_system.repository.PaymentRepository;
import com.parth.Point_of_sale_system.service.PaymentService;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RazorpayGateway razorpayGateway;
    private final StripeGateway stripeGateway;

    // ─── Helper: Generate payment reference ──────────────────────────────────────
    private String generatePaymentReference() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = paymentRepository.count() + 1;
        return String.format("PAY-%s-%06d", dateStr, count);
    }

    // ─── Helper: Resolve correct gateway for digital payments ────────────────────
    private GatewayResponse routeToGateway(PaymentMethod method, Double amount) {
        return switch (method) {
            case CARD  -> razorpayGateway.initiatePayment(amount, "INR", "card_payment");
            case UPI   -> razorpayGateway.initiatePayment(amount, "INR", "upi_payment");
            case WALLET -> stripeGateway.initiatePayment(amount, "INR", "wallet_payment");
            default    -> GatewayResponse.builder()
                            .success(true)
                            .transactionId("INTERNAL_" + System.currentTimeMillis())
                            .gatewayReference("CASH_COLLECTED")
                            .message("Cash payment recorded")
                            .build();
        };
    }

    // ─── Core: process a single payment leg ──────────────────────────────────────
    @Transactional(rollbackFor = Exception.class)
    private Payment processSingleLeg(Order order, Double amount,
                                     PaymentMethod method, String remarks,
                                     Double alreadyPaid) throws Exception {

        double grandTotal = order.getGrandTotal();

        // Guard: prevent overpayment (already paid + this leg must not exceed grand total)
        double totalAfterThisLeg = alreadyPaid + amount;
        if (totalAfterThisLeg > grandTotal + 0.01) { // 0.01 tolerance for floating point
            throw new Exception(String.format(
                "Overpayment detected. Grand total: %.2f, Already paid: %.2f, This leg: %.2f",
                grandTotal, alreadyPaid, amount));
        }

        // Route to gateway / record cash
        GatewayResponse gatewayResp = routeToGateway(method, amount);
        if (!gatewayResp.isSuccess()) {
            throw new Exception("Payment failed: " + gatewayResp.getMessage());
        }

        String gatewayName = switch (method) {
            case CARD, UPI -> razorpayGateway.getGatewayName();
            case WALLET    -> stripeGateway.getGatewayName();
            default        -> "INTERNAL";
        };

        Payment payment = Payment.builder()
                .paymentReference(generatePaymentReference())
                .order(order)
                .amount(amount)
                .paymentMethod(method)
                .paymentStatus(PaymentStatus.SUCCESS)
                .transactionId(gatewayResp.getTransactionId())
                .gatewayName(gatewayName)
                .gatewayReference(gatewayResp.getGatewayReference())
                .remarks(remarks)
                .build();

        return paymentRepository.save(payment);
    }

    // ─── Public: processPayment ───────────────────────────────────────────────────
    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<PaymentDto> processPayment(PaymentRequest request, User cashier) throws Exception {

        // 1. Validate order exists
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new Exception("Order not found: " + request.getOrderId()));

        // 2. Guard: order already fully paid
        Double alreadyPaid = paymentRepository.sumSuccessfulPaymentsByOrderId(order.getId());
        if (alreadyPaid == null) alreadyPaid = 0.0;

        if (alreadyPaid >= order.getGrandTotal() - 0.01) {
            throw new Exception("Order " + order.getOrderNumber() + " is already fully paid.");
        }

        // 3. Duplicate payment guard: no PROCESSING record should exist
        List<Payment> inProgress = paymentRepository.findByOrderIdAndPaymentStatus(
                order.getId(), PaymentStatus.PROCESSING);
        if (!inProgress.isEmpty()) {
            throw new Exception("A payment is already being processed for this order.");
        }

        List<Payment> savedPayments = new ArrayList<>();

        boolean isSplit = request.getSplitLegs() != null && !request.getSplitLegs().isEmpty();

        if (isSplit) {
            // Validate split total
            double splitTotal = request.getSplitLegs().stream()
                    .mapToDouble(PaymentRequest.PaymentLeg::getAmount).sum();
            double remaining = order.getGrandTotal() - alreadyPaid;
            if (splitTotal > remaining + 0.01) {
                throw new Exception(String.format(
                    "Split total (%.2f) exceeds remaining balance (%.2f)", splitTotal, remaining));
            }
            if (splitTotal < remaining - 0.01) {
                throw new Exception(String.format(
                    "Split total (%.2f) does not cover remaining balance (%.2f). Partial payments not yet supported via split legs.",
                    splitTotal, remaining));
            }

            double runningPaid = alreadyPaid;
            for (PaymentRequest.PaymentLeg leg : request.getSplitLegs()) {
                Payment p = processSingleLeg(order, leg.getAmount(), leg.getPaymentMethod(),
                                             leg.getRemarks(), runningPaid);
                runningPaid += leg.getAmount();
                savedPayments.add(p);
            }
        } else {
            Payment p = processSingleLeg(order, request.getAmount(),
                                         request.getPaymentMethod(),
                                         request.getRemarks(), alreadyPaid);
            savedPayments.add(p);
        }

        // 4. Recalculate total paid and update order payment status
        Double newTotalPaid = paymentRepository.sumSuccessfulPaymentsByOrderId(order.getId());
        if (newTotalPaid == null) newTotalPaid = 0.0;

        if (newTotalPaid >= order.getGrandTotal() - 0.01) {
            order.setPaymentStatus(PaymentStatus.PAID);
        } else {
            order.setPaymentStatus(PaymentStatus.PROCESSING); // partial
        }

        // Update order payment method for single-method payments
        if (!isSplit && request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod().name());
        } else if (isSplit) {
            order.setPaymentMethod(PaymentMethod.SPLIT.name());
        }

        orderRepository.save(order);

        return savedPayments.stream().map(PaymentMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public PaymentDto getPaymentById(Long id) throws Exception {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new Exception("Payment not found: " + id));
        return PaymentMapper.toDto(payment);
    }

    @Override
    public List<PaymentDto> getPaymentsByOrderId(Long orderId) throws Exception {
        return paymentRepository.findByOrderId(orderId).stream()
                .map(PaymentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentDto getPaymentByReference(String paymentReference) throws Exception {
        Payment payment = paymentRepository.findByPaymentReference(paymentReference)
                .orElseThrow(() -> new Exception("Payment not found: " + paymentReference));
        return PaymentMapper.toDto(payment);
    }

    @Override
    public Page<PaymentDto> getPaymentsByDateRange(Long storeId, LocalDateTime start,
                                                    LocalDateTime end, Pageable pageable) {
        return paymentRepository.findByStoreAndDateRange(storeId, start, end, pageable)
                .map(PaymentMapper::toDto);
    }
}
