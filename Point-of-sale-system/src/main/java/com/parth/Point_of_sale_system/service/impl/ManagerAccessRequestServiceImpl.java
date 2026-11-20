package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.AccessRequestStatus;
import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Employee;
import com.parth.Point_of_sale_system.modal.ManagerAccessRequest;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestCreateDto;
import com.parth.Point_of_sale_system.payload.dto.AccessRequestDto;
import com.parth.Point_of_sale_system.payload.dto.BranchOptionDto;
import com.parth.Point_of_sale_system.payload.dto.RejectRequestDto;
import com.parth.Point_of_sale_system.payload.dto.StoreOptionDto;
import com.parth.Point_of_sale_system.payload.response.ApiResponse;
import com.parth.Point_of_sale_system.repository.BranchRepository;
import com.parth.Point_of_sale_system.repository.EmployeeRepository;
import com.parth.Point_of_sale_system.repository.ManagerAccessRequestRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.UserRepository;
import com.parth.Point_of_sale_system.service.ManagerAccessRequestService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.service.mapper.ManagerAccessRequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerAccessRequestServiceImpl implements ManagerAccessRequestService {

    private final ManagerAccessRequestRepository accessRequestRepository;
    private final StoreRepository storeRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionService subscriptionService;

    @Override
    @Transactional(readOnly = true)
    public List<StoreOptionDto> getAvailableStores() {
        return storeRepository.findAll().stream()
                .map(s -> new StoreOptionDto(s.getId(), s.getBrand()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchOptionDto> getBranchesForStore(Long storeId) throws Exception {
        storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", storeId));

        return branchRepository.findByStoreIdAndIsActive(storeId, true).stream()
                .map(b -> new BranchOptionDto(b.getId(), b.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public ApiResponse createRequest(AccessRequestCreateDto dto) throws UserException {
        boolean isBranchManagerReq = dto.getRole() == UserRole.ROLE_BRANCH_MANAGER;
        boolean isCashierReq = dto.getRole() == UserRole.ROLE_CASHIER;

        if (!isBranchManagerReq && !isCashierReq) {
            throw new UserException("Access requests are only supported for the Branch Manager or Cashier role");
        }
        if (dto.getStoreId() == null || dto.getBranchId() == null) {
            throw new UserException("Please select a store and branch to submit a request");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new UserException("Email is required");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new UserException("Password is required");
        }
        if (userRepository.findByEmail(dto.getEmail()) != null) {
            throw new UserException("Email id already registered!");
        }
        if (accessRequestRepository.existsByEmailAndStatus(dto.getEmail(), AccessRequestStatus.PENDING)) {
            throw new UserException("A pending access request already exists for this email");
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()
                && accessRequestRepository.existsByPhoneAndStatus(dto.getPhone(), AccessRequestStatus.PENDING)) {
            throw new UserException("A pending access request already exists for this phone number");
        }

        Store store = storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new UserException("Selected store was not found"));

        Branch branch = branchRepository.findByIdAndStoreId(dto.getBranchId(), store.getId())
                .orElseThrow(() -> new UserException("Selected branch does not belong to the selected store"));

        if (isCashierReq && (branch.getIsActive() == null || !branch.getIsActive())) {
            throw new UserException("Selected branch is not active");
        }

        ManagerAccessRequest request = ManagerAccessRequest.builder()
                .fullName(dto.getFullName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .encryptedPassword(passwordEncoder.encode(dto.getPassword()))
                .requestedRole(dto.getRole())
                .store(store)
                .branch(branch)
                .status(AccessRequestStatus.PENDING)
                .build();

        accessRequestRepository.save(request);

        return isCashierReq
                ? new ApiResponse("Your request has been submitted and is pending Branch Manager approval.")
                : new ApiResponse("Your request has been submitted and is pending Store Admin approval.");
    }

    private Store resolveAdminStore(User currentUser) throws Exception {
        Store store = storeRepository.findByStoreAdminId(currentUser.getId());
        if (store == null) {
            throw new Exception("No store associated with this store admin");
        }
        return store;
    }

    private Branch resolveManagerBranch(User currentUser) throws Exception {
        Employee employee = employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new Exception("No employee record found for this manager"));

        if (employee.getBranch() == null) {
            throw new Exception("No branch associated with this manager");
        }
        return employee.getBranch();
    }

    private boolean isStoreAdminLike(User user) {
        return user.getRole() == UserRole.ROLE_ADMIN || user.getRole() == UserRole.ROLE_STORE_ADMIN;
    }

    private boolean isBranchManagerLike(User user) {
        return user.getRole() == UserRole.ROLE_BRANCH_MANAGER || user.getRole() == UserRole.ROLE_STORE_MANAGER;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccessRequestDto> getRequestsForCurrentUser(User currentUser, String status) throws Exception {
        AccessRequestStatus parsedStatus = (status != null && !status.isBlank())
                ? AccessRequestStatus.valueOf(status.trim().toUpperCase())
                : null;

        List<ManagerAccessRequest> requests;

        if (isBranchManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            requests = (parsedStatus != null)
                    ? accessRequestRepository.findByBranchIdAndRequestedRoleAndStatusOrderByCreatedAtDesc(
                    branch.getId(), UserRole.ROLE_CASHIER, parsedStatus)
                    : accessRequestRepository.findByBranchIdAndRequestedRoleOrderByCreatedAtDesc(
                    branch.getId(), UserRole.ROLE_CASHIER);
        } else if (isStoreAdminLike(currentUser)) {
            Store store = resolveAdminStore(currentUser);
            requests = (parsedStatus != null)
                    ? accessRequestRepository.findByStoreIdAndRequestedRoleAndStatusOrderByCreatedAtDesc(
                    store.getId(), UserRole.ROLE_BRANCH_MANAGER, parsedStatus)
                    : accessRequestRepository.findByStoreIdAndRequestedRoleOrderByCreatedAtDesc(
                    store.getId(), UserRole.ROLE_BRANCH_MANAGER);
        } else {
            throw new Exception("You are not authorized to view access requests");
        }

        return requests.stream().map(ManagerAccessRequestMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AccessRequestDto approveRequest(Long requestId, User currentUser) throws Exception {
        if (isBranchManagerLike(currentUser)) {
            return approveCashierRequest(requestId, currentUser);
        }
        if (isStoreAdminLike(currentUser)) {
            return approveBranchManagerRequest(requestId, currentUser);
        }
        throw new Exception("You are not authorized to approve access requests");
    }

    private AccessRequestDto approveBranchManagerRequest(Long requestId, User currentUser) throws Exception {
        Store store = resolveAdminStore(currentUser);

        ManagerAccessRequest request = accessRequestRepository
                .findByIdAndStoreIdAndRequestedRole(requestId, store.getId(), UserRole.ROLE_BRANCH_MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("AccessRequest", "id", requestId));

        if (request.getStatus() != AccessRequestStatus.PENDING) {
            throw new Exception("This request has already been " + request.getStatus().toString().toLowerCase());
        }

        Branch branch = request.getBranch();

        if (employeeRepository.existsActiveBranchManager(branch.getId())) {
            throw new Exception("This branch already has a manager.");
        }
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new Exception("Email id already registered!");
        }

        User newUser = new User();
        newUser.setFullName(request.getFullName());
        newUser.setEmail(request.getEmail());
        newUser.setPhone(request.getPhone());
        newUser.setPassword(request.getEncryptedPassword());
        newUser.setRole(UserRole.ROLE_BRANCH_MANAGER);
        newUser.setStore(store);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(newUser);

        Employee employee = Employee.builder()
                .user(savedUser)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .branch(branch)
                .store(store)
                .designation("Branch Manager")
                .isActive(true)
                .joiningDate(LocalDateTime.now())
                .build();
        employeeRepository.save(employee);

        request.setStatus(AccessRequestStatus.APPROVED);
        request.setApprovedBy(currentUser);
        request.setApprovedAt(LocalDateTime.now());
        return ManagerAccessRequestMapper.toDto(accessRequestRepository.save(request));
    }

    private AccessRequestDto approveCashierRequest(Long requestId, User currentUser) throws Exception {
        Branch branch = resolveManagerBranch(currentUser);

        ManagerAccessRequest request = accessRequestRepository
                .findByIdAndBranchIdAndRequestedRole(requestId, branch.getId(), UserRole.ROLE_CASHIER)
                .orElseThrow(() -> new ResourceNotFoundException("AccessRequest", "id", requestId));

        if (request.getStatus() != AccessRequestStatus.PENDING) {
            throw new Exception("This request has already been " + request.getStatus().toString().toLowerCase());
        }
        if (userRepository.findByEmail(request.getEmail()) != null) {
            throw new Exception("Email id already registered!");
        }

        Store store = branch.getStore();

        // Enforce subscription's cashier/employee limit ("unlimited, subject to subscription limit")
        subscriptionService.validateLimit(store.getId(), LimitType.EMPLOYEE);

        User newUser = new User();
        newUser.setFullName(request.getFullName());
        newUser.setEmail(request.getEmail());
        newUser.setPhone(request.getPhone());
        newUser.setPassword(request.getEncryptedPassword());
        newUser.setRole(UserRole.ROLE_CASHIER);
        newUser.setStore(store);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(newUser);

        Employee employee = Employee.builder()
                .user(savedUser)
                .branch(branch)
                .store(store)
                .designation("Cashier")
                .isActive(true)
                .joiningDate(LocalDateTime.now())
                .build();
        employeeRepository.save(employee);

        request.setStatus(AccessRequestStatus.APPROVED);
        request.setApprovedBy(currentUser);
        request.setApprovedAt(LocalDateTime.now());
        return ManagerAccessRequestMapper.toDto(accessRequestRepository.save(request));
    }

    @Override
    @Transactional
    public AccessRequestDto rejectRequest(Long requestId, RejectRequestDto rejectDto, User currentUser) throws Exception {
        ManagerAccessRequest request;

        if (isBranchManagerLike(currentUser)) {
            Branch branch = resolveManagerBranch(currentUser);
            request = accessRequestRepository
                    .findByIdAndBranchIdAndRequestedRole(requestId, branch.getId(), UserRole.ROLE_CASHIER)
                    .orElseThrow(() -> new ResourceNotFoundException("AccessRequest", "id", requestId));
        } else if (isStoreAdminLike(currentUser)) {
            Store store = resolveAdminStore(currentUser);
            request = accessRequestRepository
                    .findByIdAndStoreIdAndRequestedRole(requestId, store.getId(), UserRole.ROLE_BRANCH_MANAGER)
                    .orElseThrow(() -> new ResourceNotFoundException("AccessRequest", "id", requestId));
        } else {
            throw new Exception("You are not authorized to reject access requests");
        }

        if (request.getStatus() != AccessRequestStatus.PENDING) {
            throw new Exception("This request has already been " + request.getStatus().toString().toLowerCase());
        }

        request.setStatus(AccessRequestStatus.REJECTED);
        request.setApprovedBy(currentUser);
        request.setApprovedAt(LocalDateTime.now());
        request.setRejectionReason(rejectDto != null ? rejectDto.getRejectionReason() : null);

        return ManagerAccessRequestMapper.toDto(accessRequestRepository.save(request));
    }
}