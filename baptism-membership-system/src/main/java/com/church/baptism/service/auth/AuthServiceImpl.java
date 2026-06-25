package com.church.baptism.service.auth;

import com.church.baptism.dto.request.LoginRequest;
import com.church.baptism.dto.request.RegisterRequest;
import com.church.baptism.dto.request.TwoFactorVerifyRequest;
import com.church.baptism.dto.response.AuthResponse;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.elder.FirstChurchElder;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.emailverification.EmailVerificationToken;
import com.church.baptism.entity.passwordreset.PasswordResetToken;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.church.UnionRepository;
import com.church.baptism.repository.church.ChurchFieldRepository;
import com.church.baptism.repository.church.DistrictRepository;
import com.church.baptism.repository.elder.FirstChurchElderRepository;
import com.church.baptism.repository.emailverification.EmailVerificationTokenRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.passwordreset.PasswordResetTokenRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final ChurchRepository churchRepository;
    private final TwoFactorService twoFactorService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final EmailService emailService;
    private final FirstChurchElderRepository firstChurchElderRepository;
    private final UnionRepository unionRepository;
    private final ChurchFieldRepository fieldRepository;
    private final DistrictRepository districtRepository;

    public AuthServiceImpl(
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            CandidateRepository candidateRepository,
            InstructorRepository instructorRepository,
            ChurchRepository churchRepository,
            TwoFactorService twoFactorService,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            EmailService emailService,
            FirstChurchElderRepository firstChurchElderRepository,
            UnionRepository unionRepository,
            ChurchFieldRepository fieldRepository,
            DistrictRepository districtRepository
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.candidateRepository = candidateRepository;
        this.instructorRepository = instructorRepository;
        this.churchRepository = churchRepository;
        this.twoFactorService = twoFactorService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.emailService = emailService;
        this.firstChurchElderRepository = firstChurchElderRepository;
        this.unionRepository = unionRepository;
        this.fieldRepository = fieldRepository;
        this.districtRepository = districtRepository;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email)) {
            throw new RuntimeException("Email already exists");
        }

        // Public registration is only for CANDIDATE role
        User user = new User();
        user.setFullName(request.fullName);
        user.setEmail(request.email);
        user.setPhone(request.phone);
        user.setRole(Role.CANDIDATE);
        user.setPassword(passwordEncoder.encode(request.password));
        userRepository.save(user);

        createCandidateProfile(request);

        // Send email verification
        String verificationToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);
        emailVerificationTokenRepository.save(new EmailVerificationToken(verificationToken, user, expiry));
        emailService.sendEmailVerification(user.getEmail(), verificationToken);

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user);
    }

    @Override
    @Transactional
    public AuthResponse createUser(RegisterRequest request, User creator) {

        if (userRepository.existsByEmail(request.email)) {
            throw new RuntimeException("Email already exists");
        }

        switch (creator.getRole()) {
            case ADMIN:
                // Admin can create any role
                break;
            case HEAD_OF_RUM:
                if (request.role != Role.HEAD_OF_FIELD) {
                    throw new RuntimeException("Head of RUM can only create Head of Field accounts");
                }
                break;
            case HEAD_OF_FIELD:
                if (request.role != Role.HEAD_OF_DISTRICT) {
                    throw new RuntimeException("Head of Field can only create Head of District accounts");
                }
                break;
            case HEAD_OF_DISTRICT:
                if (request.role != Role.FIRST_CHURCH_ELDER) {
                    throw new RuntimeException("Head of District can only create First Church Elder accounts");
                }
                break;
            case PASTOR:
                if (request.role != Role.FIRST_CHURCH_ELDER) {
                    throw new RuntimeException("Pastor can only create First Church Elder accounts");
                }
                break;
            case FIRST_CHURCH_ELDER:
                if (request.role != Role.INSTRUCTOR && request.role != Role.CANDIDATE) {
                    throw new RuntimeException("First Church Elder can only create Instructor or Candidate accounts");
                }
                break;
            default:
                throw new RuntimeException("No permission to create users");
        }

        User user = new User();
        user.setFullName(request.fullName);
        user.setEmail(request.email);
        user.setPhone(request.phone);
        user.setRole(request.role);
        user.setPassword(passwordEncoder.encode(request.password));

        // Auto-set hierarchy assignments from request or inherit from creator
        if (request.unionId != null) {
            user.setUnion(unionRepository.findById(request.unionId).orElse(null));
        } else if (creator.getUnion() != null) {
            user.setUnion(creator.getUnion());
        }
        if (request.fieldId != null) {
            user.setField(fieldRepository.findById(request.fieldId).orElse(null));
        } else if (creator.getField() != null) {
            user.setField(creator.getField());
        }
        if (request.districtId != null) {
            user.setDistrict(districtRepository.findById(request.districtId).orElse(null));
        } else if (creator.getDistrict() != null) {
            user.setDistrict(creator.getDistrict());
        }
        if (request.churchId != null) {
            user.setChurch(churchRepository.findById(request.churchId).orElse(null));
        } else if (creator.getChurch() != null) {
            user.setChurch(creator.getChurch());
        }

        userRepository.save(user);

        // ✅ Also create profile (pass user for hierarchy inheritance)
        if (request.role == Role.CANDIDATE) {
            createCandidateProfile(request);
        } else if (request.role == Role.INSTRUCTOR) {
            createInstructorProfile(request, user);
        } else if (request.role == Role.FIRST_CHURCH_ELDER) {
            createFirstChurchElderProfile(request, user);
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (user.isTwoFactorEnabled()) {
            twoFactorService.sendAndStoreCode(user);
            return new AuthResponse(user.getEmail(), true);
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user);
    }

    @Override
    public AuthResponse verifyTwoFactor(TwoFactorVerifyRequest request) {
        User user = userRepository.findByEmail(request.email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!twoFactorService.verifyCode(user, request.code)) {
            throw new RuntimeException("Invalid or expired 2FA code");
        }

        twoFactorService.clearCode(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user);
    }

    @Override
    public void resendTwoFactorCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isTwoFactorEnabled()) {
            throw new RuntimeException("2FA is not enabled for this user");
        }

        twoFactorService.sendAndStoreCode(user);
    }

    @Override
    @Transactional
    public void sendTwoFactorSetupCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isTwoFactorEnabled()) {
            throw new RuntimeException("2FA is already enabled");
        }

        twoFactorService.sendAndStoreCode(user);
    }

    @Override
    @Transactional
    public void enableTwoFactor(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!twoFactorService.verifyCode(user, code)) {
            throw new RuntimeException("Invalid or expired code");
        }

        user.setTwoFactorEnabled(true);
        twoFactorService.clearCode(user);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void disableTwoFactor(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorCode(null);
        user.setTwoFactorCodeExpiry(null);
        userRepository.save(user);
    }

    @Override
    public boolean getTwoFactorStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.isTwoFactorEnabled();
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(token, user, expiry);
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetLink(email, token);
    }

    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("Token has already been used");
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification token"));

        if (verificationToken.isUsed()) {
            throw new RuntimeException("Token has already been used");
        }

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        emailVerificationTokenRepository.save(verificationToken);
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        // Invalidate old tokens
        emailVerificationTokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId()) && !t.isUsed())
                .forEach(t -> { t.setUsed(true); emailVerificationTokenRepository.save(t); });

        String newToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);
        emailVerificationTokenRepository.save(new EmailVerificationToken(newToken, user, expiry));
        emailService.sendEmailVerification(user.getEmail(), newToken);
    }

    // ================= HELPERS =================

    private void createCandidateProfile(RegisterRequest request) {
        Candidate candidate = new Candidate();
        candidate.setFullName(request.fullName);
        candidate.setPhone(request.phone);
        candidate.setDateOfBirth(request.dateOfBirth);
        candidate.setGender(request.gender);
        candidate.setAddress(request.address);
        candidate.setStatus(Candidate.CandidateStatus.REGISTERED);
        candidate.setCreatedAt(LocalDateTime.now());

        if (request.churchId != null) {
            Church church = churchRepository.findById(request.churchId)
                    .orElseThrow(() -> new RuntimeException("Church not found"));
            candidate.setChurch(church);
        }

        candidateRepository.save(candidate);
    }

    private void createInstructorProfile(RegisterRequest request, User user) {
        Instructor instructor = new Instructor();
        instructor.setFullName(request.fullName);
        instructor.setEmail(request.email);
        instructor.setPhone(request.phone);
        instructor.setQualification(request.qualification);
        instructor.setYearsOfService(request.yearsOfService);
        instructor.setActive(true);

        if (request.churchId != null) {
            Church church = churchRepository.findById(request.churchId)
                    .orElseThrow(() -> new RuntimeException("Church not found"));
            instructor.setChurch(church);
        } else if (user.getChurch() != null) {
            instructor.setChurch(user.getChurch());
        }

        instructorRepository.save(instructor);
    }

    private void createFirstChurchElderProfile(RegisterRequest request, User user) {
        FirstChurchElder elder = new FirstChurchElder();
        elder.setFullName(request.fullName);
        elder.setEmail(request.email);
        elder.setPhone(request.phone);
        elder.setActive(true);

        if (request.churchId != null) {
            Church church = churchRepository.findById(request.churchId)
                    .orElseThrow(() -> new RuntimeException("Church not found"));
            elder.setChurch(church);
        } else if (user.getChurch() != null) {
            elder.setChurch(user.getChurch());
        }

        firstChurchElderRepository.save(elder);
    }
}