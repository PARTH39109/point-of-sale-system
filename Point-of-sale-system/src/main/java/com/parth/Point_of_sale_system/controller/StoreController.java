package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.StoreDto;
import com.parth.Point_of_sale_system.service.StoreService;
import com.parth.Point_of_sale_system.service.UserService;
import com.parth.Point_of_sale_system.service.mapper.StoreMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/store")
public class StoreController {

    private final StoreService storeService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<StoreDto> createStore(@RequestBody StoreDto storeDto,
                                                @RequestHeader("Authorization") String jwt
    ) throws UserException {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(storeService.createStore(storeDto, user));
    }

    @GetMapping
    public ResponseEntity<List<StoreDto>> getAllStore(
            @RequestHeader("Authorization") String jwt
    ) {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @GetMapping("/admin")
    public ResponseEntity<StoreDto> getStoreByAdmin(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        return ResponseEntity.ok(StoreMapper.toDto(storeService.getStoreByAdmin()));
    }

    @GetMapping("/employee")
    public ResponseEntity<StoreDto> getStoreByEmployee(
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        return ResponseEntity.ok(storeService.getStoreByEmployee());
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoreDto> updateStore(@PathVariable Long id,
                                                 @RequestBody StoreDto storeDto)
            throws Exception {
        return ResponseEntity.ok(storeService.updateStore(id, storeDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoreDto> getStoreById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        return ResponseEntity.ok(storeService.getStoreById(id));
    }
}

