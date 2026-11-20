package com.parth.Point_of_sale_system.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.parth.Point_of_sale_system.domain.PaymentStatus;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.gateway.GatewayResponse;
import com.parth.Point_of_sale_system.gateway.impl.RazorpayGateway;
import com.parth.Point_of_sale_system.mapper.SubscriptionPaymentMapper;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.StoreSubscription;
import com.parth.Point_of_sale_system.modal.SubscriptionPayment;
import com.parth.Point_of_sale_system.modal.SubscriptionPlan;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.*;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.StoreSubscriptionRepository;
import com.parth.Point_of_sale_system.repository.SubscriptionPaymentRepository;
import com.parth.Point_of_sale_system.repository.SubscriptionPlanRepository;
import com.parth.Point_of_sale_system.service.SubscriptionPaymentService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionPaymentServiceImpl implements SubscriptionPaymentService {

    private final SubscriptionPaymentRepository subscriptionPaymentRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final StoreRepository storeRepository;
    private final StoreSubscriptionRepository storeSubscriptionRepository;
    private final RazorpayGateway razorpayGateway;
    private final SubscriptionService subscriptionService;

    @Value("${razorpay.key.id:}")
    private String razorpayPublicKeyId;

    private Store resolveStore(User user) throws Exception {
        if (user.getRole() != UserRole.ROLE_STORE_ADMIN) {
            throw new UserException("Only the Store Admin can manage billing for this store");
        }
        Store store = storeRepository.findByStoreAdminId(user.getId());
        if (store == null) throw new Exception("No store associated with this admin");
        return store;
    }

    @Override
    public CreateSubscriptionOrderResponse createOrder(CreateSubscriptionOrderRequest request, User user) throws Exception {
        Store store = resolveStore(user);

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getSubscriptionPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", request.getSubscriptionPlanId()));

        if (plan.getPrice() == null || plan.getPrice() <= 0) {
            throw new UserException("This plan does not require online payment.");
        }

        String receipt = "sub_" + store.getId() + "_" + System.currentTimeMillis();
        GatewayResponse gatewayResp = razorpayGateway.createCheckoutOrder(plan.getPrice(), "INR", receipt);

        if (!gatewayResp.isSuccess()) {
            throw new Exception(gatewayResp.getMessage());
        }

        String razorpayOrderId = gatewayResp.getTransactionId();
        long amountInPaise = Math.round(plan.getPrice() * 100);

        SubscriptionPayment payment = SubscriptionPayment.builder()
                .store(store)
                .subscriptionPlan(plan)
                .amount(plan.getPrice())
                .currency("INR")
                .paymentStatus(PaymentStatus.PENDING)
                .gatewayName(razorpayGateway.getGatewayName())
                .razorpayOrderId(razorpayOrderId)
                .build();
        subscriptionPaymentRepository.save(payment);

        return CreateSubscriptionOrderResponse.builder()
                .key(razorpayPublicKeyId)
                .orderId(razorpayOrderId)
                .amount(amountInPaise)
                .currency("INR")
                .planName(plan.getName())
                .planPrice(plan.getPrice())
                .build();
    }

    @Override
    public VerifySubscriptionPaymentResponse verifyPayment(VerifySubscriptionPaymentRequest request, User user) throws Exception {
        Store store = resolveStore(user);

        SubscriptionPayment payment = subscriptionPaymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new Exception("Payment order not found"));

        if (!payment.getStore().getId().equals(store.getId())) {
            throw new UserException("This payment does not belong to your store");
        }
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new UserException("This payment has already been verified");
        }

        boolean isValid = razorpayGateway.verifyCheckoutSignature(
                request.getRazorpayOrderId(), request.getRazorpayPaymentId(), request.getRazorpaySignature());

        if (!isValid) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            subscriptionPaymentRepository.save(payment);
            return VerifySubscriptionPaymentResponse.builder()
                    .success(false)
                    .message("Payment verification failed. No changes have been made to your subscription.")
                    .build();
        }

        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionReference("TXN-" + System.currentTimeMillis());
        payment.setPaymentMethod(razorpayGateway.fetchPaymentMethod(request.getRazorpayPaymentId()));

        SubscriptionPayment saved = subscriptionPaymentRepository.save(payment);
        saved.setInvoiceNumber(String.format("SUB-INV-%s-%06d",
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")), saved.getId()));
        saved = subscriptionPaymentRepository.save(saved);

        // Activate the plan ONLY now, after payment is confirmed — reuses the existing, already-tested
        // SubscriptionServiceImpl.upgradePlan logic rather than duplicating limit/expiry computation here.
        subscriptionService.upgradePlan(store.getId(), saved.getSubscriptionPlan().getType());

        StoreSubscription sub = storeSubscriptionRepository.findByStoreId(store.getId())
                .orElseThrow(() -> new Exception("Subscription record missing after activation"));

        return VerifySubscriptionPaymentResponse.builder()
                .success(true)
                .message("Payment verified. Your subscription has been upgraded to " + saved.getSubscriptionPlan().getName() + ".")
                .invoiceNumber(saved.getInvoiceNumber())
                .planName(saved.getSubscriptionPlan().getName())
                .validUntil(sub.getEndDate())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPaymentHistoryDto> getHistory(User user) throws Exception {
        Store store = resolveStore(user);
        return subscriptionPaymentRepository.findByStoreIdOrderByCreatedAtDesc(store.getId())
                .stream().map(SubscriptionPaymentMapper::toHistoryDto).collect(Collectors.toList());
    }

    private SubscriptionPayment resolvePaidInvoice(String invoiceNumber, User user) throws Exception {
        Store store = resolveStore(user);
        SubscriptionPayment payment = subscriptionPaymentRepository.findByInvoiceNumberAndStoreId(invoiceNumber, store.getId())
                .orElseThrow(() -> new Exception("Invoice not found: " + invoiceNumber));
        if (payment.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new Exception("Invoice is only available for successful payments");
        }
        return payment;
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionInvoiceDto getInvoice(String invoiceNumber, User user) throws Exception {
        return SubscriptionPaymentMapper.toInvoiceDto(resolvePaidInvoice(invoiceNumber, user));
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(String invoiceNumber, User user) throws Exception {
        SubscriptionPayment payment = resolvePaidInvoice(invoiceNumber, user);
        SubscriptionInvoiceDto invoice = SubscriptionPaymentMapper.toInvoiceDto(payment);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);

        Paragraph title = new Paragraph("SUBSCRIPTION INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph invNo = new Paragraph(invoice.getInvoiceNumber(), subTitleFont);
        invNo.setAlignment(Element.ALIGN_CENTER);
        invNo.setSpacingAfter(20);
        document.add(invNo);

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setSpacingAfter(20);

        addRow(infoTable, "Store Name", invoice.getStoreName(), headerFont, normalFont);
        addRow(infoTable, "Store Owner", invoice.getStoreOwnerName(), headerFont, normalFont);
        addRow(infoTable, "Email", invoice.getStoreOwnerEmail(), headerFont, normalFont);
        addRow(infoTable, "Plan Purchased", invoice.getPlanName(), headerFont, normalFont);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy");
        String billingPeriod = (invoice.getBillingPeriodStart() != null ? invoice.getBillingPeriodStart().format(fmt) : "-")
                + " to " + (invoice.getBillingPeriodEnd() != null ? invoice.getBillingPeriodEnd().format(fmt) : "-");
        addRow(infoTable, "Billing Period", billingPeriod, headerFont, normalFont);

        addRow(infoTable, "Payment Method", invoice.getPaymentMethod(), headerFont, normalFont);
        addRow(infoTable, "Transaction ID", invoice.getRazorpayPaymentId(), headerFont, normalFont);
        addRow(infoTable, "Payment Date", invoice.getPaidAt() != null ? invoice.getPaidAt().format(fmt) : "-", headerFont, normalFont);
        addRow(infoTable, "Status", invoice.getStatus(), headerFont, normalFont);

        document.add(infoTable);

        PdfPTable amountTable = new PdfPTable(2);
        amountTable.setWidthPercentage(50);
        amountTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

        PdfPCell amtLabel = new PdfPCell(new Phrase("Amount Paid", boldFont));
        amtLabel.setBorder(Rectangle.TOP);
        amtLabel.setPadding(8);
        PdfPCell amtValue = new PdfPCell(new Phrase(invoice.getCurrency() + " " + String.format("%.2f", invoice.getAmount()), boldFont));
        amtValue.setBorder(Rectangle.TOP);
        amtValue.setPadding(8);
        amountTable.addCell(amtLabel);
        amountTable.addCell(amtValue);

        document.add(amountTable);

        Paragraph note = new Paragraph("This is a system-generated invoice for a test-mode subscription payment.", subTitleFont);
        note.setAlignment(Element.ALIGN_CENTER);
        note.setSpacingBefore(30);
        document.add(note);

        document.close();
        return out.toByteArray();
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(4);
        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "-", valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(4);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}