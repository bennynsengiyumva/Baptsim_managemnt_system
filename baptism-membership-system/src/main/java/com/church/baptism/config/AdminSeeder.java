package com.church.baptism.config;

import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class AdminSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
public void createAdmin() {
    Optional<User> existing = userRepository.findByEmail("admin@church.org");

    if (existing.isEmpty()) {
        User admin = new User();
        admin.setFullName("System Administrator");
        admin.setEmail("admin@church.org");
        admin.setPhone("0000000000");
        admin.setRole(Role.ADMIN);
        admin.setPassword(passwordEncoder.encode("123456"));
        userRepository.save(admin);
        System.out.println("Default Admin Created");

    } else if (!existing.get().getPassword().startsWith("$2a$")) {
        // Password is plain text — re-encode it
        existing.get().setPassword(passwordEncoder.encode("Admin@123"));
        userRepository.save(existing.get());
        System.out.println("Admin password re-encoded");
    }
}
}