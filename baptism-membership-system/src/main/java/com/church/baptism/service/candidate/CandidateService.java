package com.church.baptism.service.candidate;

import com.church.baptism.dto.request.CandidateRequest;
import com.church.baptism.dto.response.CandidateResponse;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CandidateService {

    public static final int MAX_CANDIDATES_PER_INSTRUCTOR = 20;

    private final CandidateRepository repository;
    private final ChurchRepository churchRepository;
    private final InstructorRepository instructorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public CandidateService(
            CandidateRepository repository,
            ChurchRepository churchRepository,
            InstructorRepository instructorRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService) {
        this.repository = repository;
        this.churchRepository = churchRepository;
        this.instructorRepository = instructorRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    // ================= REGISTER =================
    @Transactional
    public CandidateResponse registerCandidate(CandidateRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            User user = new User();
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail());
            user.setPhone(request.getPhone());
            user.setRole(Role.CANDIDATE);
            user.setPassword(passwordEncoder.encode(
                request.getPassword() != null ? request.getPassword() : "changeme123"
            ));
            userRepository.save(user);
        }

        Church church = churchRepository.findById(request.getChurchId())
                .orElseThrow(() -> new RuntimeException("Church not found"));

        Candidate candidate = new Candidate();
        candidate.setFullName(request.getFullName());
        candidate.setEmail(request.getEmail());
        candidate.setDateOfBirth(request.getDateOfBirth());
        candidate.setGender(request.getGender());
        candidate.setPhone(request.getPhone());
        candidate.setAddress(request.getAddress());
        candidate.setReferralSource(request.getReferralSource());
        candidate.setChurch(church);
        candidate.setStatus(Candidate.CandidateStatus.REGISTERED);
        candidate.setCreatedAt(LocalDateTime.now());

        if (request.getInstructorId() != null) {
            Instructor instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));

            validateInstructorAssignment(instructor, church.getId());

            candidate.setInstructor(instructor);
        }

        CandidateResponse response = mapToResponse(repository.save(candidate));

        if (candidate.getInstructor() != null) {
            String candidateName = candidate.getFullName();
            String instructorName = candidate.getInstructor().getFullName();

            // Notify candidate
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Instructor Assigned",
                    candidateName + ", you have been assigned an instructor called " + instructorName,
                    NotificationType.INSTRUCTOR_ASSIGNED)
            );

            // Notify instructor
            userRepository.findByEmail(instructorEmail(candidate.getInstructor())).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "New Candidate Assigned",
                    "You have been assigned a new candidate: " + candidateName,
                    NotificationType.INSTRUCTOR_ASSIGNED)
            );
        }

        return response;
    }

    // ================= GET ALL =================
    public List<CandidateResponse> getAllCandidates() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ================= GET BY ID =================
    public CandidateResponse getCandidateById(Long id) {
        return mapToResponse(repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id)));
    }

    // ================= GET BY EMAIL (for CANDIDATE role self-view) =================
    // ================= GET BY CHURCH (for FIRST_CHURCH_ELDER) =================
    public List<CandidateResponse> getCandidatesByChurch(Long churchId) {
        return repository.findByChurchId(churchId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CandidateResponse> getCandidatesByEmail(String email) {
        List<CandidateResponse> results = repository.findByEmail(email).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        // Fallback: if no candidate found by email field, try to find by matching User email
        if (results.isEmpty() && email != null) {
            userRepository.findByEmail(email).ifPresent(user -> {
                repository.findAll().stream()
                    .filter(c -> c.getFullName() != null && c.getFullName().equalsIgnoreCase(user.getFullName()))
                    .filter(c -> c.getEmail() == null || c.getEmail().isBlank())
                    .findFirst()
                    .ifPresent(candidate -> {
                        candidate.setEmail(email);
                        repository.save(candidate);
                        results.add(mapToResponse(candidate));
                    });
            });
        }

        return results;
    }

    // ================= GET BY INSTRUCTOR =================
    public List<CandidateResponse> getCandidatesByInstructor(Long instructorId) {
        return repository.findByInstructorId(instructorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ================= GET UNASSIGNED =================
    public List<CandidateResponse> getUnassignedCandidates(Long churchId) {
        List<Candidate> list = (churchId != null)
                ? repository.findByInstructorIsNullAndChurchId(churchId)
                : repository.findByInstructorIsNull();
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ================= ASSIGN INSTRUCTOR (single) =================
    @Transactional
    public CandidateResponse assignInstructor(Long candidateId, Long instructorId) {
        Candidate candidate = repository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));
        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new RuntimeException("Instructor not found: " + instructorId));

        validateInstructorAssignment(instructor, candidate.getChurch().getId());

        candidate.setInstructor(instructor);
        instructor.getCandidates().add(candidate);
        CandidateResponse response = mapToResponse(repository.save(candidate));

        // Notify candidate
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Instructor Assigned",
                candidate.getFullName() + ", you have been assigned an instructor called " + instructor.getFullName(),
                NotificationType.INSTRUCTOR_ASSIGNED)
        );

        // Notify instructor
        userRepository.findByEmail(instructorEmail(instructor)).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "New Candidate Assigned",
                "You have been assigned a new candidate: " + candidate.getFullName(),
                NotificationType.INSTRUCTOR_ASSIGNED)
        );

        return response;
    }

    // ================= UNASSIGN INSTRUCTOR =================
    @Transactional
    public CandidateResponse unassignInstructor(Long candidateId) {
        Candidate candidate = repository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));
        candidate.setInstructor(null);
        return mapToResponse(repository.save(candidate));
    }

    // ================= BULK ASSIGN (called by InstructorService) =================
    @Transactional
    public void bulkAssignInstructor(Long instructorId, List<Long> candidateIds) {
        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new RuntimeException("Instructor not found: " + instructorId));

        List<Candidate> candidates = repository.findAllById(candidateIds);
        if (candidates.isEmpty()) {
            throw new RuntimeException("No candidates found for given IDs");
        }

        int currentCount = instructor.getCandidates() != null
                ? instructor.getCandidates().size() : 0;
        int remaining = MAX_CANDIDATES_PER_INSTRUCTOR - currentCount;

        if (candidates.size() > remaining) {
            throw new RuntimeException(
                "Adding " + candidates.size() + " candidates would exceed max " + MAX_CANDIDATES_PER_INSTRUCTOR
                + ". Instructor has " + currentCount + " candidates, can accept " + remaining + " more."
            );
        }

        for (Candidate c : candidates) {
            if (c.getChurch() == null || !c.getChurch().getId().equals(instructor.getChurch().getId())) {
                throw new RuntimeException(
                    "Candidate \"" + c.getFullName() + "\" does not belong to the instructor's church"
                );
            }
        }

        candidates.forEach(c -> c.setInstructor(instructor));
        repository.saveAll(candidates);

        // Notify each candidate + instructor
        String instructorName = instructor.getFullName();
        candidates.forEach(c -> {
            userRepository.findByEmail(c.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Instructor Assigned",
                    c.getFullName() + ", you have been assigned an instructor called " + instructorName,
                    NotificationType.INSTRUCTOR_ASSIGNED)
            );
            userRepository.findByEmail(instructorEmail(instructor)).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "New Candidate Assigned",
                    "You have been assigned a new candidate: " + c.getFullName(),
                    NotificationType.INSTRUCTOR_ASSIGNED)
            );
        });
    }

    // ================= VALIDATION HELPERS =================

    private void validateInstructorAssignment(Instructor instructor, Long candidateChurchId) {
        // Instructor and candidate must share the same church
        if (!instructor.getChurch().getId().equals(candidateChurchId)) {
            throw new RuntimeException("Instructor must belong to the same church as the candidate");
        }

        // Instructor must have capacity
        int currentCount = instructor.getCandidates() != null
                ? instructor.getCandidates().size() : 0;
        if (currentCount >= MAX_CANDIDATES_PER_INSTRUCTOR) {
            throw new RuntimeException(
                "Instructor already has " + currentCount + " candidates (max " + MAX_CANDIDATES_PER_INSTRUCTOR + ")"
            );
        }
    }

    // ================= UPDATE =================
    @Transactional
    public CandidateResponse updateCandidate(Long id, CandidateRequest request) {
        Candidate candidate = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));

        Instructor previousInstructor = candidate.getInstructor();

        candidate.setFullName(request.getFullName());
        candidate.setDateOfBirth(request.getDateOfBirth());
        candidate.setGender(request.getGender());
        candidate.setPhone(request.getPhone());
        candidate.setAddress(request.getAddress());
        candidate.setReferralSource(request.getReferralSource());

        if (request.getChurchId() != null) {
            Church church = churchRepository.findById(request.getChurchId())
                    .orElseThrow(() -> new RuntimeException("Church not found"));
            candidate.setChurch(church);
        }
        if (request.getInstructorId() != null) {
            Instructor instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
            Long churchId = candidate.getChurch() != null ? candidate.getChurch().getId() : null;
            if (request.getChurchId() != null) {
                churchId = request.getChurchId();
            }
            if (churchId != null) {
                validateInstructorAssignment(instructor, churchId);
            }
            candidate.setInstructor(instructor);
        }

        CandidateResponse response = mapToResponse(repository.save(candidate));

        // Notify if instructor changed
        Instructor newInstructor = candidate.getInstructor();
        if (newInstructor != null && !newInstructor.equals(previousInstructor)) {
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Instructor Assigned",
                    candidate.getFullName() + ", you have been assigned an instructor called " + newInstructor.getFullName(),
                    NotificationType.INSTRUCTOR_ASSIGNED)
            );
            userRepository.findByEmail(instructorEmail(newInstructor)).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "New Candidate Assigned",
                    "You have been assigned a new candidate: " + candidate.getFullName(),
                    NotificationType.INSTRUCTOR_ASSIGNED)
            );
        }

        return response;
    }

    // ================= DELETE =================
    @Transactional
    public void deleteCandidate(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Candidate not found: " + id);
        }
        repository.deleteById(id);
    }

    // ================= PUBLIC HELPERS =================
    public Candidate getCandidateEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + id));
    }

    public Candidate saveCandidate(Candidate candidate) {
        return repository.save(candidate);
    }

    // ================= MAPPER =================
    public CandidateResponse mapToResponse(Candidate candidate) {
        CandidateResponse r = new CandidateResponse();
        r.setId(candidate.getId());
        r.setFullName(candidate.getFullName());
        r.setEmail(candidate.getEmail());
        r.setPhone(candidate.getPhone());
        r.setGender(candidate.getGender());
        r.setAddress(candidate.getAddress());
        r.setDateOfBirth(candidate.getDateOfBirth());
        r.setStatus(candidate.getStatus().name());
        r.setInstructorApproved(candidate.isInstructorApproved());
        r.setChurchId(candidate.getChurch() != null ? candidate.getChurch().getId() : null);
        r.setChurchName(candidate.getChurch() != null ? candidate.getChurch().getChurchName() : null);
        if (candidate.getInstructor() != null) {
            r.setInstructorId(candidate.getInstructor().getId());
            r.setInstructorName(candidate.getInstructor().getFullName());
            r.setInstructorEmail(candidate.getInstructor().getEmail());
            r.setInstructorPhone(candidate.getInstructor().getPhone());
        }
        r.setProfilePicturePath(candidate.getProfilePicturePath());
        r.setCreatedAt(candidate.getCreatedAt());
        return r;
    }

    private String instructorEmail(Instructor instructor) {
        return instructor.getEmail();
    }
}