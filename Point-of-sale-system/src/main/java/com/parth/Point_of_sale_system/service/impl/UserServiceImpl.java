package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.configuration.JwtProvider;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.UserRepository;
import com.parth.Point_of_sale_system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository ;
    private final JwtProvider jwtProvider ;
    private final StoreRepository storeRepository;
    private final com.parth.Point_of_sale_system.service.SubscriptionService subscriptionService;

    @Override
    public User getUserfromJwtToken(String token) throws UserException {

        String email = jwtProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email);

        if(user==null){
            throw new UserException("Invalid Token ");
        }

        return user;
    }

    @Override
    public User getCurrentUser() throws UserException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email);

        if(user==null) {
            throw new UserException("User not found ");
        }

        return user;
    }

    @Override
    public User getUserByEmail(String email) throws UserException {
        User user = userRepository.findByEmail(email);

        if(user==null) {
            throw new UserException("User not found ");
        }

        return user;    }

    @Override
    public User getUserById(Long id) throws UserException, Exception {
        return userRepository.findById(id)
                .orElseThrow(
                        () -> new Exception("User not found")
                );
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll() ;
    }

    @Override
    public Store resolveStoreForUser(User user) throws UserException {
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
        }
        Store store = user.getStore();
        if (store == null) {
            throw new UserException("You are not associated with any store");
        }
        return store;
    }
}
