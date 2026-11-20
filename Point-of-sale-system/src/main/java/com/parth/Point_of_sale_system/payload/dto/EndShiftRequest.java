package com.parth.Point_of_sale_system.payload.dto;

import lombok.Data;

@Data
public class EndShiftRequest {
    private Double closingCashActual;
    private String notes;
}