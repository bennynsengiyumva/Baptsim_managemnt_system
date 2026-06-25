package com.church.baptism.service.instructor;

import com.church.baptism.dto.request.InstructorRequest;
import com.church.baptism.dto.response.InstructorResponse;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.candidate.CandidateService;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InstructorService {

    private final InstructorRepository repository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CandidateService candidateService;

    public InstructorService(
            InstructorRepository repository,
            ChurchRepository churchRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Lazy CandidateService candidateService
    ) {
        this.repository = repository;
        this.churchRepository = churchRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.candidateService = candidateService;
    }

    // ================= CREATE =================
    @Transactional
    public InstructorResponse createInstructor(InstructorRequest request) {

        if (userRepository.existsByEmail(request.email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setFullName(request.fullName);
        user.setEmail(request.email);
        user.setPhone(request.phone);
        user.setRole(Role.INSTRUCTOR);
        user.setPassword(passwordEncoder.encode(request.password));
        userRepository.save(user);

        Church church = churchRepository.findById(request.churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));

        Instructor instructor = new Instructor();
        instructor.setFullName(request.fullName);
        instructor.setEmail(request.email);
        instructor.setPhone(request.phone);
        instructor.setChurch(church);
        instructor.setQualification(request.qualification);
        instructor.setYearsOfService(request.yearsOfService);
        instructor.setActive(true);

        return mapToResponse(repository.save(instructor));
    }

    // ================= GET ALL =================
    public List<InstructorResponse> getAllInstructors() {
        return repository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ================= GET BY CHURCH =================
    public List<InstructorResponse> getByChurchId(Long churchId) {
        return repository.findByChurchId(churchId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ================= GET BY ID =================
    public InstructorResponse getInstructorById(Long id) {
        Instructor instructor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instructor not found: " + id));
        return mapToResponse(instructor);
    }

    // ================= UPDATE =================
    @Transactional
    public InstructorResponse updateInstructor(Long id, InstructorRequest request) {

        Instructor instructor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instructor not found: " + id));

        instructor.setFullName(request.fullName);
        instructor.setEmail(request.email);
        instructor.setPhone(request.phone);

        Church church = churchRepository.findById(request.churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));
        instructor.setChurch(church);
        instructor.setQualification(request.qualification);
        instructor.setYearsOfService(request.yearsOfService);

        userRepository.findByEmail(request.email).ifPresent(u -> {
            u.setFullName(request.fullName);
            u.setPhone(request.phone);
            userRepository.save(u);
        });

        return mapToResponse(repository.save(instructor));
    }

    // ================= DELETE =================
    @Transactional
    public void deleteInstructor(Long id) {
        Instructor instructor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Instructor not found: " + id));
        userRepository.findByEmail(instructor.getEmail())
                .ifPresent(userRepository::delete);
        repository.deleteById(id);
    }

    // ================= ASSIGN CANDIDATES (bulk) =================
    // Delegates to CandidateService — single source of truth for assignment
    @Transactional
    public InstructorResponse assignCandidates(Long instructorId, List<Long> candidateIds) {
        candidateService.bulkAssignInstructor(instructorId, candidateIds);
        return getInstructorById(instructorId);
    }

    // ================= STATS =================
    public InstructorStats getStatistics() {
        long total = repository.count();
        long active = repository.countByActiveTrue();
        return new InstructorStats(total, active);
    }

    // ================= MAPPER =================
    private InstructorResponse mapToResponse(Instructor instructor) {
        InstructorResponse res = new InstructorResponse();
        res.id = instructor.getId();
        res.fullName = instructor.getFullName();
        res.email = instructor.getEmail();
        res.phone = instructor.getPhone();
        res.churchId = instructor.getChurch().getId();
        res.churchName = instructor.getChurch().getChurchName();
        res.qualification = instructor.getQualification();
        res.yearsOfService = instructor.getYearsOfService();
        res.active = instructor.isActive();
        res.candidateCount = instructor.getCandidates() != null
                ? instructor.getCandidates().size() : 0;
        return res;
    }

    // ================= STATS DTO =================
    public static class InstructorStats {
        public long totalInstructors;
        public long activeInstructors;

        public InstructorStats(long total, long active) {
            this.totalInstructors = total;
            this.activeInstructors = active;
        }
    }
}