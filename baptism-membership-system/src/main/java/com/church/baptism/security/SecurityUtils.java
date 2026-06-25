package com.church.baptism.security;

import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private static UserRepository staticUserRepository;

    public SecurityUtils(UserRepository userRepository) {
        SecurityUtils.staticUserRepository = userRepository;
    }

    public static User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        String email = auth.getName();
        return staticUserRepository.findByEmail(email).orElse(null);
    }

    public static Long getCurrentUserId() {
        User user = getCurrentUser();
        return user != null ? user.getId() : null;
    }
}
