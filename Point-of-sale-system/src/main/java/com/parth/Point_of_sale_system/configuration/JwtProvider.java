package com.parth.Point_of_sale_system.configuration;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Component
public class JwtProvider {

     @Value("${jwt.secret:}")
     private String configuredJwtSecret;

     private static SecretKey key;

     @PostConstruct
     public void init() {
         if (configuredJwtSecret != null && !configuredJwtSecret.isBlank()) {
             JwtConstant.setSecret(configuredJwtSecret);
         }
         key = Keys.hmacShaKeyFor(JwtConstant.getSecret().getBytes());
     }

     static {
         key = Keys.hmacShaKeyFor(JwtConstant.getSecret().getBytes());
     }

     public String generateToken(Authentication authentication) {
         Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

         String roles = populateAuthorities(authorities);

         return Jwts.builder()
                 .issuedAt(new Date())
                 .expiration(new Date(new Date().getTime()+86400000))
                 .claim("email",authentication.getName())
                 .claim("authorities",roles)
                 .signWith(key)
                 .compact();

     }


     public String getEmailFromToken(String jwt) {
         jwt = jwt.substring(7);
         Claims claims = Jwts.parser()
                 .verifyWith(key)
                 .build()
                 .parseSignedClaims(jwt)
                 .getPayload();

         return String.valueOf(claims.get("email"));
     }

    private String populateAuthorities(Collection<? extends GrantedAuthority> authorities) {

         Set<String> auths = new HashSet<>();
         for(GrantedAuthority authority : authorities) {
             auths.add(authority.getAuthority());
         }

         return String.join(",",auths);

    }

}
