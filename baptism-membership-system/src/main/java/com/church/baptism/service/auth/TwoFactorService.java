package com.church.baptism.service.auth;

import com.church.baptism.entity.user.User;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class TwoFactorService {

    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRY_MINUTES = 10;

    private final UserRepository userRepository;
    private final EmailService emailService;

    public TwoFactorService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public String generateCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    @Transactional
    public void sendAndStoreCode(User user) {
        String code = generateCode();
        user.setTwoFactorCode(code);
        user.setTwoFactorCodeExpiry(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));
        userRepository.save(user);
        emailService.sendTwoFactorCode(user.getEmail(), code);
    }

    public boolean verifyCode(User user, String code) {
        if (user.getTwoFactorCode() == null || user.getTwoFactorCodeExpiry() == null) {
            return false;
        }
        if (LocalDateTime.now().isAfter(user.getTwoFactorCodeExpiry())) {
            return false;
        }
        return user.getTwoFactorCode().equals(code.trim());
    }

    @Transactional
    public void clearCode(User user) {
        user.setTwoFactorCode(null);
        user.setTwoFactorCodeExpiry(null);
        userRepository.save(user);
    }
}
