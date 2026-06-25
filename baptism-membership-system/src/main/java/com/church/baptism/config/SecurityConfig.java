package com.church.baptism.config;

import com.church.baptism.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // PUBLIC ENDPOINTS
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/refresh",
                                "/api/auth/verify-2fa",
                                "/api/auth/two-factor/resend",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/verify-email",
                                "/api/auth/resend-verification",
                                "/ws",
                                "/ws/**",
                                "/error"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/churches", "/api/churches/**").permitAll()

                        // AUTH REQUIRED
                        .requestMatchers("/api/auth/**").authenticated()

                        // USERS — profile is personal, mutations are sensitive
                        .requestMatchers(HttpMethod.GET, "/api/users/profile").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/users").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.PUT, "/api/users/*/role").hasAnyRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/*/status").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/**").authenticated()
                        .requestMatchers("/api/users/**").authenticated()

                        // UNIONS — admin and head_of_rum
                        .requestMatchers(HttpMethod.POST, "/api/unions", "/api/unions/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.PUT, "/api/unions/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.DELETE, "/api/unions/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.GET, "/api/unions", "/api/unions/**").authenticated()

                        // FIELDS
                        .requestMatchers(HttpMethod.POST, "/api/fields", "/api/fields/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.PUT, "/api/fields/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.DELETE, "/api/fields/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.GET, "/api/fields", "/api/fields/**").authenticated()

                        // DISTRICTS
                        .requestMatchers(HttpMethod.POST, "/api/districts", "/api/districts/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.PUT, "/api/districts/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.DELETE, "/api/districts/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.GET, "/api/districts", "/api/districts/**").authenticated()

                        // CHURCHES — creation and management
                        .requestMatchers(HttpMethod.POST, "/api/churches").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.PUT, "/api/churches/*/assign-pastor").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.PUT, "/api/churches/*/unassign-pastor").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.PUT, "/api/churches/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.DELETE, "/api/churches/**").hasAnyRole("ADMIN", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.GET, "/api/churches", "/api/churches/**").authenticated()

                        // FIRST CHURCH ELDERS
                        .requestMatchers(HttpMethod.POST, "/api/first-church-elders", "/api/first-church-elders/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/first-church-elders/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/first-church-elders/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR")
                        .requestMatchers(HttpMethod.GET, "/api/first-church-elders", "/api/first-church-elders/**").authenticated()

                        // INSTRUCTORS — GET accessible to most, mutations restricted
                        .requestMatchers(HttpMethod.GET, "/api/instructors", "/api/instructors/**").authenticated()
                        .requestMatchers("/api/instructors/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR", "FIRST_CHURCH_ELDER")

                        // CANDIDATES
                        .requestMatchers(HttpMethod.GET, "/api/candidates", "/api/candidates/**").authenticated()
                        .requestMatchers("/api/candidates/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR", "FIRST_CHURCH_ELDER")

                        // BAPTISM
                        .requestMatchers(HttpMethod.POST, "/api/baptisms/events").hasAnyRole("ADMIN", "PASTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/baptisms/events/**").hasAnyRole("ADMIN", "PASTOR")
                        .requestMatchers(HttpMethod.POST, "/api/baptisms/register").hasAnyRole("CANDIDATE", "PASTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/baptisms/approve").hasAnyRole("ADMIN", "PASTOR", "FIRST_CHURCH_ELDER", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.POST, "/api/baptisms/*/confirm").hasAnyRole("ADMIN", "PASTOR")
                        .requestMatchers(HttpMethod.POST, "/api/baptisms/*/order").hasAnyRole("ADMIN", "PASTOR")
                        .requestMatchers("/api/baptisms/export").hasAnyRole("ADMIN", "PASTOR", "HEAD_OF_DISTRICT", "HEAD_OF_FIELD", "HEAD_OF_RUM")
                        .requestMatchers(HttpMethod.GET, "/api/baptisms", "/api/baptisms/**").authenticated()
                        .requestMatchers("/api/baptisms/**").hasAnyRole("ADMIN", "PASTOR")

                        // CERTIFICATES
                        .requestMatchers(HttpMethod.PUT, "/api/certificates/*/sign").hasAnyRole("ADMIN", "PASTOR", "HEAD_OF_DISTRICT")
                        .requestMatchers(HttpMethod.GET, "/api/certificates/unsigned").hasAnyRole("ADMIN", "PASTOR", "HEAD_OF_DISTRICT")
                        .requestMatchers("/api/certificates/**").authenticated()

                        // LESSONS / COURSES
                        .requestMatchers(HttpMethod.POST, "/api/lessons/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR", "FIRST_CHURCH_ELDER", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/lessons", "/api/lessons/**").authenticated()
                        .requestMatchers("/api/lessons/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR", "FIRST_CHURCH_ELDER", "INSTRUCTOR")

                        // MESSAGES
                        .requestMatchers("/api/messages/**").authenticated()

                        // NOTIFICATIONS
                        .requestMatchers(HttpMethod.GET, "/api/notifications/me/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/me/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()

                        // ANALYTICS
                        .requestMatchers(HttpMethod.GET, "/api/analytics", "/api/analytics/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")

                        // REPORTS
                        .requestMatchers(HttpMethod.GET, "/api/reports", "/api/reports/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT")

                        // PASTOR — view and assign candidates
                        .requestMatchers(HttpMethod.GET, "/api/pastor/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR", "FIRST_CHURCH_ELDER", "INSTRUCTOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/pastor/**").hasAnyRole("ADMIN", "HEAD_OF_RUM", "HEAD_OF_FIELD", "HEAD_OF_DISTRICT", "PASTOR", "FIRST_CHURCH_ELDER")

                        // EVERYTHING ELSE
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
