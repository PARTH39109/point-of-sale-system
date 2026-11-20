package com.parth.Point_of_sale_system.configuration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.List;

public class JwtValidator extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String jwt = request.getHeader(JwtConstant.JWT_HEADER);

        System.out.println("========================================");
        System.out.println("Incoming Request : " + request.getMethod() + " " + request.getRequestURI());
        System.out.println("Authorization    : " + jwt);

        if (jwt != null && jwt.startsWith("Bearer ") && jwt.length() > 7) {

            jwt = jwt.substring(7);

            try {
                SecretKey key = Keys.hmacShaKeyFor(JwtConstant.getSecret().getBytes());

                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(jwt)
                        .getPayload();

                String email = String.valueOf(claims.get("email"));
                String authorities = String.valueOf(claims.get("authorities"));

                System.out.println("JWT Email        : " + email);
                System.out.println("JWT Authorities  : " + authorities);

                List<GrantedAuthority> auths =
                        AuthorityUtils.commaSeparatedStringToAuthorityList(authorities);

                System.out.println("Parsed Roles     : " + auths);

                Authentication authentication =
                        new UsernamePasswordAuthenticationToken(email, null, auths);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("Authentication SUCCESS");
            } catch (Exception e) {

                System.out.println("JWT ERROR : " + e.getMessage());

                SecurityContextHolder.clearContext();
            }

        } else {
            System.out.println("No JWT Found");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null) {
            System.out.println("SecurityContext User  : " + auth.getName());
            System.out.println("SecurityContext Roles : " + auth.getAuthorities());
        } else {
            System.out.println("SecurityContext is EMPTY");
        }

        System.out.println("========================================");

        filterChain.doFilter(request, response);
    }
}