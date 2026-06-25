package com.church.baptism.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    private final String SECRET = "baptism-system-secret-key";

    @Bean
    public String jwtSecret() {
        return SECRET;
    }
}