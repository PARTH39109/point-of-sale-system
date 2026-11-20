package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.ShiftLabel;
import lombok.Data;

@Data
public class StartShiftRequest {
    private ShiftLabel shiftLabel;
    private Double openingCash;
    private String notes;
}