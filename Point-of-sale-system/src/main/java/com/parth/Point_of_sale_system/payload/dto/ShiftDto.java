package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.ShiftLabel;
import com.parth.Point_of_sale_system.domain.ShiftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftDto {
    private Long id;
    private Long cashierId;
    private String cashierName;
    private Long branchId;
    private String branchName;
    private ShiftLabel shiftLabel;
    private ShiftStatus status;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String durationLabel;
    private Double openingCash;
    private Double closingCashActual;
    private Long orderCount;
    private Double totalSales;
}