package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.*;
import com.parth.Point_of_sale_system.service.ShiftService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/shift")
public class ShiftController {

    private final ShiftService shiftService;
    private final UserService userService;

    @PostMapping("/start")
    public ResponseEntity<ShiftDto> startShift(@RequestBody StartShiftRequest request, @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(shiftService.startShift(request, user));
    }

    @PutMapping("/{id}/end")
    public ResponseEntity<ShiftDto> endShift(@PathVariable Long id, @RequestBody EndShiftRequest request, @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(shiftService.endShift(id, request, user));
    }

    @GetMapping("/active")
    public ResponseEntity<ShiftDto> getActiveShift(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(shiftService.getActiveShiftForCurrentUser(user));
    }

    @GetMapping
    public ResponseEntity<List<ShiftDto>> getShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long cashierId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String shiftLabel,
            @RequestParam(required = false) String status,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(shiftService.getShifts(user, date, cashierId, branchId, shiftLabel, status));
    }

    @GetMapping("/kpis")
    public ResponseEntity<ShiftKpiDto> getKpis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long branchId,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(shiftService.getKpis(user, date, branchId));
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<ShiftReportDto> getShiftReport(@PathVariable Long id, @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(shiftService.getShiftReport(id, user));
    }
}