package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.domain.LimitType;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.ResourceNotFoundException;
import com.parth.Point_of_sale_system.modal.Branch;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.BranchDto;
import com.parth.Point_of_sale_system.repository.BranchRepository;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.UserRepository;
import com.parth.Point_of_sale_system.service.BranchService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.service.mapper.BranchMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    private Store getUserStore(User user) throws Exception {
        if (user.getRole() == UserRole.ROLE_STORE_ADMIN) {
            Store store = storeRepository.findByStoreAdminId(user.getId());
            if (store == null) {
                store = user.getStore();
            }
            if (store == null) {
                store = new Store();
                store.setBrand(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() + "'s Store" : "My Store");
                store.setStoreAdmin(user);
                store.setStatus(com.parth.Point_of_sale_system.domain.StoreStatus.ACTIVE);
                store = storeRepository.save(store);
                subscriptionService.assignDefaultSubscription(store);
                user.setStore(store);
                userRepository.save(user);
            }
            return store;
        } else {
            Store store = user.getStore();
            if (store == null) {
                throw new Exception("You are not associated with any store");
            }
            return store;
        }
    }

    @Override
    public BranchDto createBranch(BranchDto branchDto, User user) throws Exception {
        Store store;
        if (user.getRole() == UserRole.ROLE_ADMIN && branchDto.getStoreId() != null) {
            store = storeRepository.findById(branchDto.getStoreId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store", "id", branchDto.getStoreId()));
        } else {
            store = getUserStore(user);
        }

        subscriptionService.validateLimit(store.getId(), LimitType.BRANCH);

        Branch branch = BranchMapper.toEntity(branchDto, store);
        Branch saved = branchRepository.save(branch);
        return BranchMapper.toDto(saved);
    }

    @Override
    public BranchDto getBranchById(Long id, User user) throws Exception {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));

        // Security check: Only allow if it's the user's store branch
        if (user.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(user);
            if (!branch.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized access to this branch");
            }
        }

        return BranchMapper.toDto(branch);
    }

    @Override
    public List<BranchDto> getBranchesByStore(User user) throws Exception {
        Store store = getUserStore(user);
        List<Branch> branches = branchRepository.findByStoreId(store.getId());
        return branches.stream().map(BranchMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public BranchDto updateBranch(Long id, BranchDto branchDto, User user) throws Exception {
        Branch existing = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));

        if (user.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(user);
            if (!existing.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to update this branch");
            }
        }

        existing.setName(branchDto.getName());
        existing.setAddress(branchDto.getAddress());
        existing.setPhone(branchDto.getPhone());
        existing.setEmail(branchDto.getEmail());
        existing.setManagerName(branchDto.getManagerName());
        if (branchDto.getIsActive() != null) {
            existing.setIsActive(branchDto.getIsActive());
        }

        Branch updated = branchRepository.save(existing);
        return BranchMapper.toDto(updated);
    }

    @Override
    public void deleteBranch(Long id, User user) throws Exception {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", id));

        if (user.getRole() != UserRole.ROLE_ADMIN) {
            Store store = getUserStore(user);
            if (!branch.getStore().getId().equals(store.getId())) {
                throw new Exception("Unauthorized to delete this branch");
            }
        }

        branchRepository.delete(branch);
    }
}
