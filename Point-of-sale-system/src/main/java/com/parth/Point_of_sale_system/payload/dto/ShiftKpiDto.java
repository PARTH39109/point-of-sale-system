package com.parth.Point_of_sale_system.payload.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftKpiDto {
    private Long activeShifts;
    private Double totalSalesToday;
    private Long totalOrders;
    private Long cashiersOnShift;
    private Long cancelledOrders;
    private Double totalPaymentsCollected;
}