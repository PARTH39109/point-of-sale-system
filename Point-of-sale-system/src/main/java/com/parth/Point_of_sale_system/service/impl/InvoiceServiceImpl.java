package com.parth.Point_of_sale_system.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.mapper.OrderMapper;
import com.parth.Point_of_sale_system.modal.Order;
import com.parth.Point_of_sale_system.modal.OrderItem;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.OrderDto;
import com.parth.Point_of_sale_system.modal.BranchSettings;
import com.parth.Point_of_sale_system.repository.OrderRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.BranchSettingsRepository;
import com.parth.Point_of_sale_system.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceServiceImpl implements InvoiceService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final BranchSettingsRepository branchSettingsRepository;

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

    private void checkStoreAccess(Order order, Store store) throws Exception {
        if (!order.getStore().getId().equals(store.getId())) {
            throw new Exception("Unauthorized access to this invoice/order");
        }
    }

    @Override
    public OrderDto getInvoiceByInvoiceNumber(String invoiceNumber, User user) throws Exception {
        Store store = resolveStore(user);
        Order order = orderRepository.findByOrderNumber(invoiceNumber)
                .orElseGet(() -> orderRepository.findByOrderNumber(invoiceNumber).orElse(null));

        // Let's also check by invoiceNumber directly
        if (order == null) {
            order = orderRepository.findAll().stream()
                    .filter(o -> invoiceNumber.equals(o.getInvoiceNumber()))
                    .findFirst()
                    .orElseThrow(() -> new Exception("Invoice not found: " + invoiceNumber));
        }

        checkStoreAccess(order, store);
        return OrderMapper.toDto(order);
    }

    @Override
    public OrderDto getInvoiceByOrderId(Long orderId, User user) throws Exception {
        Store store = resolveStore(user);
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new Exception("Order not found: " + orderId));
        checkStoreAccess(order, store);
        return OrderMapper.toDto(order);
    }

    @Override
    public byte[] generateInvoicePdf(String invoiceNumber, User user) throws Exception {
        OrderDto orderDto = getInvoiceByInvoiceNumber(invoiceNumber, user);

        // We'll fetch the full Order modal to get details if needed
        Order order = orderRepository.findByIdWithItems(orderDto.getId())
                .orElseThrow(() -> new Exception("Order not found"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        PdfWriter.getInstance(document, out);

        document.open();

        // Styles
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);

        // --- Resolve branch-specific receipt settings ---
        BranchSettings branchSettings = null;
        if (order.getBranch() != null) {
            branchSettings = branchSettingsRepository.findByBranchId(order.getBranch().getId()).orElse(null);
        }

        String receiptBranchName  = branchSettings != null && branchSettings.getReceiptBranchName() != null
                ? branchSettings.getReceiptBranchName()
                : (order.getBranch() != null ? order.getBranch().getName() : "Main Branch");
        String receiptAddress = branchSettings != null && Boolean.TRUE.equals(branchSettings.getShowBranchAddress()) && branchSettings.getReceiptAddress() != null
                ? branchSettings.getReceiptAddress()
                : (order.getBranch() != null && order.getBranch().getAddress() != null ? order.getBranch().getAddress() : "");
        String receiptPhone = branchSettings != null && Boolean.TRUE.equals(branchSettings.getShowPhoneNumber()) && branchSettings.getReceiptPhone() != null
                ? "Phone: " + branchSettings.getReceiptPhone()
                : (order.getBranch() != null && order.getBranch().getPhone() != null ? "Phone: " + order.getBranch().getPhone() : "");
        String receiptGst = branchSettings != null && Boolean.TRUE.equals(branchSettings.getShowGstNumber()) && branchSettings.getReceiptGstNumber() != null
                ? "GST: " + branchSettings.getReceiptGstNumber()
                : "";
        String receiptHeader = branchSettings != null && branchSettings.getReceiptHeader() != null
                ? branchSettings.getReceiptHeader() : "";

        // --- Header Section ---
        Paragraph storeName = new Paragraph(order.getStore().getBrand().toUpperCase(), titleFont);
        storeName.setAlignment(Element.ALIGN_CENTER);
        document.add(storeName);

        StringBuilder headerLines = new StringBuilder(receiptBranchName);
        if (!receiptAddress.isBlank()) headerLines.append("\n").append(receiptAddress);
        if (!receiptPhone.isBlank()) headerLines.append("\n").append(receiptPhone);
        if (!receiptGst.isBlank()) headerLines.append("\n").append(receiptGst);
        if (!receiptHeader.isBlank()) headerLines.append("\n").append(receiptHeader);

        Paragraph storeDetails = new Paragraph(headerLines.toString(), subTitleFont);
        storeDetails.setAlignment(Element.ALIGN_CENTER);
        document.add(storeDetails);

        document.add(new Paragraph(" ")); // Spacer

        // --- Order & Invoice Info Table ---
        Table infoTable = new Table(2);
        infoTable.setWidth(100);
        infoTable.setBorderWidth(0.5f);
        infoTable.setPadding(3);

        Cell cell1 = new Cell(new Paragraph("Invoice No: " + order.getInvoiceNumber(), boldFont));
        cell1.setBorder(Cell.NO_BORDER);
        infoTable.addCell(cell1);

        Cell cell2 = new Cell(new Paragraph("Date: " + order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")), normalFont));
        cell2.setBorder(Cell.NO_BORDER);
        infoTable.addCell(cell2);

        Cell cell3 = new Cell(new Paragraph("Order No: " + order.getOrderNumber(), normalFont));
        cell3.setBorder(Cell.NO_BORDER);
        infoTable.addCell(cell3);

        Cell cell4 = new Cell(new Paragraph("Cashier: " + order.getCashier().getFullName(), normalFont));
        cell4.setBorder(Cell.NO_BORDER);
        infoTable.addCell(cell4);

        if (order.getCustomer() != null) {
            Cell custCell = new Cell(new Paragraph("Customer: " + order.getCustomer().getName() + " (" + order.getCustomer().getPhone() + ")", normalFont));
            custCell.setColspan(2);
            custCell.setBorder(Cell.NO_BORDER);
            infoTable.addCell(custCell);
        } else {
            Cell guestCell = new Cell(new Paragraph("Customer: Walk-in Customer", normalFont));
            guestCell.setColspan(2);
            guestCell.setBorder(Cell.NO_BORDER);
            infoTable.addCell(guestCell);
        }

        document.add(infoTable);
        document.add(new Paragraph(" ")); // Spacer

        // --- Product Items Table ---
        Table table = new Table(7);
        table.setWidth(100);
        table.setBorderWidth(0.5f);
        table.setPadding(3);
        table.setWidths(new float[]{35f, 15f, 10f, 10f, 10f, 10f, 10f});

        // Headers
        table.addCell(new Cell(new Paragraph("Product Name", headerFont)));
        table.addCell(new Cell(new Paragraph("SKU", headerFont)));
        table.addCell(new Cell(new Paragraph("Qty", headerFont)));
        table.addCell(new Cell(new Paragraph("Price", headerFont)));
        table.addCell(new Cell(new Paragraph("Disc", headerFont)));
        table.addCell(new Cell(new Paragraph("Tax", headerFont)));
        table.addCell(new Cell(new Paragraph("Total", headerFont)));

        for (OrderItem item : order.getOrderItems()) {
            table.addCell(new Cell(new Paragraph(item.getProduct().getName(), normalFont)));
            table.addCell(new Cell(new Paragraph(item.getProduct().getSku(), normalFont)));
            table.addCell(new Cell(new Paragraph(String.valueOf(item.getQuantity()), normalFont)));
            table.addCell(new Cell(new Paragraph(String.format("INR %.2f", item.getUnitPrice()), normalFont)));
            table.addCell(new Cell(new Paragraph(String.format("INR %.2f", item.getDiscount() != null ? item.getDiscount() : 0.0), normalFont)));
            table.addCell(new Cell(new Paragraph(String.format("INR %.2f", item.getTax() != null ? item.getTax() : 0.0), normalFont)));
            table.addCell(new Cell(new Paragraph(String.format("INR %.2f", item.getLineTotal()), normalFont)));
        }

        document.add(table);
        document.add(new Paragraph(" ")); // Spacer

        // --- Summary Totals ---
        Table summaryTable = new Table(2);
        summaryTable.setWidth(100);
        summaryTable.setBorderWidth(0);
        summaryTable.setPadding(2);

        // Align right logic
        Cell spacerCell = new Cell("");
        spacerCell.setBorder(Cell.NO_BORDER);

        Cell subCellLabel = new Cell(new Paragraph("Subtotal:", normalFont));
        subCellLabel.setBorder(Cell.NO_BORDER);
        Cell subCellVal = new Cell(new Paragraph(String.format("INR %.2f", order.getSubtotal()), normalFont));
        subCellVal.setBorder(Cell.NO_BORDER);
        summaryTable.addCell(subCellLabel);
        summaryTable.addCell(subCellVal);

        Cell discLabel = new Cell(new Paragraph("Discount:", normalFont));
        discLabel.setBorder(Cell.NO_BORDER);
        Cell discVal = new Cell(new Paragraph(String.format("-INR %.2f", order.getDiscountAmount() != null ? order.getDiscountAmount() : 0.0), normalFont));
        discVal.setBorder(Cell.NO_BORDER);
        summaryTable.addCell(discLabel);
        summaryTable.addCell(discVal);

        Cell taxLabel = new Cell(new Paragraph("Tax (GST):", normalFont));
        taxLabel.setBorder(Cell.NO_BORDER);
        Cell taxVal = new Cell(new Paragraph(String.format("INR %.2f", order.getTaxAmount() != null ? order.getTaxAmount() : 0.0), normalFont));
        taxVal.setBorder(Cell.NO_BORDER);
        summaryTable.addCell(taxLabel);
        summaryTable.addCell(taxVal);

        Cell totalLabel = new Cell(new Paragraph("Grand Total:", boldFont));
        totalLabel.setBorder(Cell.NO_BORDER);
        Cell totalVal = new Cell(new Paragraph(String.format("INR %.2f", order.getGrandTotal()), boldFont));
        totalVal.setBorder(Cell.NO_BORDER);
        summaryTable.addCell(totalLabel);
        summaryTable.addCell(totalVal);

        Cell pmLabel = new Cell(new Paragraph("Payment Method:", normalFont));
        pmLabel.setBorder(Cell.NO_BORDER);
        Cell pmVal = new Cell(new Paragraph(order.getPaymentMethod(), normalFont));
        pmVal.setBorder(Cell.NO_BORDER);
        summaryTable.addCell(pmLabel);
        summaryTable.addCell(pmVal);

        Cell psLabel = new Cell(new Paragraph("Payment Status:", normalFont));
        psLabel.setBorder(Cell.NO_BORDER);
        Cell psVal = new Cell(new Paragraph(order.getPaymentStatus().name(), boldFont));
        psVal.setBorder(Cell.NO_BORDER);
        summaryTable.addCell(psLabel);
        summaryTable.addCell(psVal);

        document.add(summaryTable);
        document.add(new Paragraph(" ")); // Spacer

        // --- Footer Section (Branch-specific) ---
        String thankYouMsg = branchSettings != null && branchSettings.getReceiptThankYouMessage() != null
                ? branchSettings.getReceiptThankYouMessage().toUpperCase()
                : "THANK YOU FOR YOUR BUSINESS!";
        Paragraph thankYou = new Paragraph(thankYouMsg, boldFont);
        thankYou.setAlignment(Element.ALIGN_CENTER);
        document.add(thankYou);

        String returnPolicy = branchSettings != null && branchSettings.getReceiptReturnPolicy() != null
                ? branchSettings.getReceiptReturnPolicy()
                : "Return & Exchange Policy:\n1. Items can be returned/exchanged within 7 days with original receipt.\n2. Damaged or used goods are not eligible for refunds.";
        Paragraph terms = new Paragraph(returnPolicy, FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY));
        terms.setAlignment(Element.ALIGN_CENTER);
        document.add(terms);

        String receiptFooter = branchSettings != null && branchSettings.getReceiptFooter() != null
                ? branchSettings.getReceiptFooter() : "";
        if (!receiptFooter.isBlank()) {
            Paragraph footer = new Paragraph(receiptFooter, FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);
        }

        document.add(new Paragraph(" "));

        // QR Code Placeholder
        Paragraph qrPlaceholder = new Paragraph("[ QR Code Verification Placeholder ]", subTitleFont);
        qrPlaceholder.setAlignment(Element.ALIGN_CENTER);
        document.add(qrPlaceholder);

        document.close();
        return out.toByteArray();
    }
}