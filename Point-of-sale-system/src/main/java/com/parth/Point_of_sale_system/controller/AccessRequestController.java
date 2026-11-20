package com.parth.Point_of_sale_system.controller;

import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestDto;
import com.parth.Point_of_sale_system.payload.dto.RejectRequestDto;
import com.parth.Point_of_sale_system.service.ManagerAccessRequestService;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/access-requests")
public class AccessRequestController {

    private final ManagerAccessRequestService accessRequestService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AccessRequestDto>> getRequests(
            @RequestHeader("Authorization") String jwt,
            @RequestParam(required = false) String status
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(accessRequestService.getRequestsForCurrentUser(user, status));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<AccessRequestDto> approve(
            @PathVariable Long id,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(accessRequestService.approveRequest(id, user));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<AccessRequestDto> reject(
            @PathVariable Long id,
            @RequestBody(required = false) RejectRequestDto rejectRequestDto,
            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.getUserfromJwtToken(jwt);
        return ResponseEntity.ok(accessRequestService.rejectRequest(id, rejectRequestDto, user));
    }
}