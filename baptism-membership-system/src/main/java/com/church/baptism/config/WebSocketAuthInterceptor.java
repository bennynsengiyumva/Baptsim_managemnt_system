package com.church.baptism.config;

import com.church.baptism.security.JwtService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public WebSocketAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    var claims = jwtService.extractClaimsRelaxed(token);
                    String email = claims.getSubject();
                    String role = claims.get("role", String.class);

                    if (email != null && role != null) {
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + role)
                        );
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(email, null, authorities);
                        accessor.setUser(auth);
                    }
                } catch (Exception e) {
                    // Invalid token — allow anonymous connection but queue will be user-scoped anyway
                }
            }
        }

        return message;
    }
}
