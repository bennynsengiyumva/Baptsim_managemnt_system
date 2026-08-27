package com.church.baptism.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> writeBuckets = new ConcurrentHashMap<>();

    private static final int GENERAL_LIMIT = 100;
    private static final int AUTH_LIMIT = 10;
    private static final int WRITE_LIMIT = 30;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = getClientIp(request);

        if (isAuthEndpoint(path)) {
            Bucket bucket = authBuckets.computeIfAbsent(clientIp, k ->
                    Bucket.builder()
                            .addLimit(Bandwidth.simple(AUTH_LIMIT, Duration.ofMinutes(1)))
                            .build()
            );
            if (!bucket.tryConsume(1)) {
                send429(response, "Rate limit exceeded for authentication. Max 10 requests per minute.");
                return false;
            }
        }

        if (isWriteOperation(method)) {
            String userKey = getUserKey(request, clientIp);
            Bucket bucket = writeBuckets.computeIfAbsent(userKey, k ->
                    Bucket.builder()
                            .addLimit(Bandwidth.simple(WRITE_LIMIT, Duration.ofMinutes(1)))
                            .build()
            );
            if (!bucket.tryConsume(1)) {
                send429(response, "Rate limit exceeded for write operations. Max 30 requests per minute.");
                return false;
            }
        }

        String userKey = getUserKey(request, clientIp);
        Bucket bucket = generalBuckets.computeIfAbsent(userKey, k ->
                Bucket.builder()
                        .addLimit(Bandwidth.simple(GENERAL_LIMIT, Duration.ofMinutes(1)))
                        .build()
        );
        if (!bucket.tryConsume(1)) {
            send429(response, "Rate limit exceeded. Max 100 requests per minute.");
            return false;
        }

        return true;
    }

    private boolean isAuthEndpoint(String path) {
        return path.startsWith("/api/auth/");
    }

    private boolean isWriteOperation(String method) {
        return "POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getUserKey(HttpServletRequest request, String clientIp) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "user:" + authHeader.substring(7).hashCode();
        }
        return "ip:" + clientIp;
    }

    private void send429(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = Map.of(
                "status", 429,
                "error", "Too Many Requests",
                "message", message
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
