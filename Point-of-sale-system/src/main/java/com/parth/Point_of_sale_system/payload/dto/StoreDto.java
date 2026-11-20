package com.parth.Point_of_sale_system.payload.dto;

import com.parth.Point_of_sale_system.domain.StoreStatus;
import com.parth.Point_of_sale_system.modal.StoreContact;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StoreDto {
    private Long id;
    private String brand;
    private UserDto storeAdmin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String description;
    private String storeType;
    private StoreStatus status;
    private StoreContact contact;
}

