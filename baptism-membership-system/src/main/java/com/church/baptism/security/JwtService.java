package com.church.baptism.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private final Key key = Keys.hmacShaKeyFor(
            "baptism-system-secret-key-baptism-system-secret-key".getBytes()
    );

    private final long EXPIRATION = 1000 * 60 * 60 * 24; // 1 day

    // GENERATE TOKEN
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // EXTRACT EMAIL
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    // VALIDATE TOKEN (THIS FIXES YOUR ERROR)
    public boolean isValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    // CHECK EXPIRATION
    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    // PARSE CLAIMS (throws on expired)
    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // PARSE CLAIMS even if expired (for refresh)
    public Claims extractClaimsRelaxed(String token) {
        try {
            return extractClaims(token);
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public long getExpirationMs() {
        return EXPIRATION;
    }
}