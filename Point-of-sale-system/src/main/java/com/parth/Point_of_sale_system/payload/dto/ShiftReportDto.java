package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.ShiftLabel;
import com.parth.Point_of_sale_system.domain.ShiftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftReportDto {
    private Long shiftId;
    private String cashierName;
    private String branchName;
    private ShiftLabel shiftLabel;
    private ShiftStatus status;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;

    // KPIs
    private Long totalOrders;
    private Long cancelledOrders;
    private Double totalSales;
    private Double totalDiscount;
    private Integer itemsSold;
    private Double averageBillValue;
    private Long returnsCount;
    private Double returnsAmount;

    private List<PaymentBreakdownItem> paymentBreakdown;
    private List<HourlySalesPoint> hourlySales;
    private List<TopProductItem> topProducts;
    private List<LowStockItem> lowStockItems;
    private List<ReturnItem> returns;

    // Cash reconciliation
    private Double openingCash;
    private Double cashCollected;
    private Double expectedCash;
    private Double actualCash;
    private Double cashDifference;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentBreakdownItem {
        private String method;
        private Double amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlySalesPoint {
        private Integer hour;
        private Double sales;
        private Long orderCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopProductItem {
        private String productName;
        private Long qtySold;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LowStockItem {
        private String productName;
        private Integer remaining;
        private Integer minStockLevel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReturnItem {
        private String billNumber;
        private String customerName;
        private Double amount;
        private String reason;
    }
}