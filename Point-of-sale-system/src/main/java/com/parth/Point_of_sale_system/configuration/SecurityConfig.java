package com.parth.Point_of_sale_system.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/super-admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/store/**").hasAnyRole("ADMIN", "STORE_ADMIN")
                        // Branch Managers/Store Managers can now approve their own (Cashier) requests
                        .requestMatchers("/api/access-requests/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER")
                        .requestMatchers("/api/subscriptions/**").hasAnyRole("ADMIN", "STORE_ADMIN")
                        .requestMatchers("/api/subscription-payment/**").hasRole("STORE_ADMIN")
                        .requestMatchers("/api/bi/**").hasAnyRole("ADMIN", "STORE_ADMIN")
                        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER")
                        .requestMatchers("/api/branch/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER")
                        .requestMatchers("/api/employee/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER")
                        .requestMatchers("/api/cashier/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER")
                        .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER")
                        .requestMatchers("/api/shift/**").hasAnyRole("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "STORE_MANAGER", "CASHIER")
                        // Catalog now belongs to Branch Manager, not Store Admin
                        .requestMatchers("/api/product/**").hasAnyRole("ADMIN", "BRANCH_MANAGER", "STORE_MANAGER", "CASHIER")
                        .requestMatchers("/api/category/**").hasAnyRole("ADMIN", "BRANCH_MANAGER", "STORE_MANAGER", "CASHIER")
                        .requestMatchers("/api/inventory/**").hasAnyRole("ADMIN", "BRANCH_MANAGER", "STORE_MANAGER", "CASHIER")
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers("/api/payments/**").authenticated()
                        .requestMatchers("/api/refunds/**").authenticated()
                        .requestMatchers("/api/invoices/**").authenticated()
                        .requestMatchers("/api/customer/**").authenticated()
                        .requestMatchers("/api/users/**").authenticated()
                        .requestMatchers("/api/coupon/**").authenticated()
                        .requestMatchers("/api/notification/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new JwtValidator(), BasicAuthenticationFilter.class)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:4173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}