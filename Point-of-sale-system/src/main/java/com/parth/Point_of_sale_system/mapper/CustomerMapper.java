package com.parth.Point_of_sale_system.mapper;

import com.parth.Point_of_sale_system.modal.Customer;
import com.parth.Point_of_sale_system.payload.dto.CustomerDto;

public class CustomerMapper {

    public static CustomerDto toDto(Customer customer) {
        if (customer == null) {
            return null;
        }

        return CustomerDto.builder()
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .loyaltyPoints(customer.getLoyaltyPoints())
                .notes(customer.getNotes())
                .branchId(customer.getBranch() != null ? customer.getBranch().getId() : null)
                .branchName(customer.getBranch() != null ? customer.getBranch().getName() : null)
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    public static Customer toEntity(CustomerDto dto) {
        if (dto == null) {
            return null;
        }

        Customer customer = new Customer();
        customer.setId(dto.getId());
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        customer.setLoyaltyPoints(dto.getLoyaltyPoints());
        customer.setNotes(dto.getNotes());

        return customer;
    }
}