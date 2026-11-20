package com.parth.Point_of_sale_system.service.impl;

import com.parth.Point_of_sale_system.configuration.JwtProvider;
import com.parth.Point_of_sale_system.domain.StoreStatus;
import com.parth.Point_of_sale_system.domain.UserRole;
import com.parth.Point_of_sale_system.exception.UserException;
import com.parth.Point_of_sale_system.modal.Store;
import com.parth.Point_of_sale_system.modal.User;
import com.parth.Point_of_sale_system.payload.dto.UserDto;
import com.parth.Point_of_sale_system.payload.response.AuthResponse;
import com.parth.Point_of_sale_system.repository.StoreRepository;
import com.parth.Point_of_sale_system.repository.UserRepository;
import com.parth.Point_of_sale_system.service.AuthService;
import com.parth.Point_of_sale_system.service.SubscriptionService;
import com.parth.Point_of_sale_system.service.mapper.UserMapped;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Set;

@Service
@RequiredArgsConstructor

public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final SubscriptionService subscriptionService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final CustomUserImplementation customUserImplementation ;

    // Roles that belong to an existing store's branch and must go through
    // /auth/access-request so the Store Admin (or Branch Manager, for
    // Cashiers) can approve which store + branch they're assigned to. This
    // is what keeps multi-tenant data isolated: no anonymous sign-up can
    // attach itself to somebody else's store.
    private static final Set<UserRole> BRANCH_SCOPED_ROLES = Set.of(
            UserRole.ROLE_BRANCH_MANAGER,
            UserRole.ROLE_CASHIER
    );

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuthResponse register(UserDto userDto) throws UserException {
        User user = userRepository.findByEmail(userDto.getEmail());
        if(user!=null){
            throw new UserException("Email id already registered ! ");
        }

        if (UserRole.ROLE_ADMIN.equals(userDto.getRole())) {
            throw new UserException("Role admin is not allowed!");
        }

        if (BRANCH_SCOPED_ROLES.contains(userDto.getRole())) {
            throw new UserException(
                    "Branch Manager and Cashier accounts must request access to a store and branch — " +
                            "use the Request Access flow instead of direct registration."
            );
        }

        if (UserRole.ROLE_STORE_ADMIN.equals(userDto.getRole())
                && (userDto.getStoreName() == null || userDto.getStoreName().isBlank())) {
            throw new UserException("Store Name is required for Store Admin registration");
        }

        User newUser = new User();
        newUser.setEmail(userDto.getEmail());
        newUser.setPassword(passwordEncoder.encode(userDto.getPassword()));
        newUser.setRole(userDto.getRole());
        newUser.setFullName(userDto.getFullName());
        newUser.setPhone(userDto.getPhone());
        newUser.setLastLoginAt(LocalDateTime.now());
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(newUser);

        if (UserRole.ROLE_STORE_ADMIN.equals(userDto.getRole())) {
            // ── Multi-tenancy: every Store Admin gets their own isolated Store ──
            Store store = new Store();
            store.setBrand(userDto.getStoreName().trim());
            store.setStoreAdmin(savedUser);
            store.setStatus(StoreStatus.ACTIVE);
            Store savedStore = storeRepository.save(store);

            // Default (Basic) subscription so the new tenant can start using
            // the product immediately without a manual plan assignment step.
            subscriptionService.assignDefaultSubscription(savedStore);

            // Keep User.store in sync too — some read paths use it directly.
            savedUser.setStore(savedStore);
            savedUser = userRepository.save(savedUser);
        }

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(userDto.getEmail(),userDto.getPassword());

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtProvider.generateToken(authentication);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setJwt(jwt);
        authResponse.setMessage("registered Successfully");
        authResponse.setUser(UserMapped.userDto(savedUser));

        return authResponse;
    }

    @Override
    public AuthResponse login(UserDto userDto) throws UserException {
        String email = userDto.getEmail();
        String password = userDto.getPassword();
        Authentication authentication = authenticate(email , password);

        SecurityContextHolder.getContext().setAuthentication(authentication);
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        String role = authorities.iterator().next().getAuthority();
        String jwt = jwtProvider.generateToken(authentication);

        User user = userRepository.findByEmail(email);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setJwt(jwt);
        authResponse.setMessage("Login Successfully");
        authResponse.setUser(UserMapped.userDto(user));


        return authResponse;
    }

    private Authentication authenticate(String email , String Password) throws UserException {

        UserDetails userDetails = customUserImplementation.loadUserByUsername(email);

        if(userDetails == null ) {
            throw new UserException("Email id doesn't exist "+ email);
        }

        if(!passwordEncoder.matches(Password ,userDetails.getPassword()))
        {
            throw new UserException("Password doesn't match");
        }


        return new UsernamePasswordAuthenticationToken(userDetails , null ,userDetails.getAuthorities()) ;
    }
}