package com.church.baptism.controller;

import com.church.baptism.dto.request.CandidateRequest;
import com.church.baptism.dto.response.CandidateDetailResponse;
import com.church.baptism.dto.response.CandidateResponse;
import com.church.baptism.dto.response.CandidateDashboardResponse;
import com.church.baptism.dto.response.LessonGradeResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.lesson.LessonAttempt;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonAttemptRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.service.candidate.CandidateService;
import com.church.baptism.service.candidate.CandidateDashboardService;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidates")
@CrossOrigin(origins = "*")
public class CandidateController {

    private final CandidateService service;
    private final CandidateDashboardService dashboardService;
    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final LessonAttemptRepository attemptRepository;
    private final BaptismRepository baptismRepository;
    private final UserRepository userRepository;
    private final InstructorRepository instructorRepository;
    private final NotificationService notificationService;

    @Value("${app.profile-picture-storage:uploads/profile-pictures}")
    private String profilePicturePath;

    public CandidateController(CandidateService service,
                               CandidateDashboardService dashboardService,
                               CandidateRepository candidateRepository,
                               LessonRepository lessonRepository,
                               LessonAttemptRepository attemptRepository,
                               BaptismRepository baptismRepository,
                               UserRepository userRepository,
                               InstructorRepository instructorRepository,
                               NotificationService notificationService) {
        this.service = service;
        this.dashboardService = dashboardService;
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.attemptRepository = attemptRepository;
        this.baptismRepository = baptismRepository;
        this.userRepository = userRepository;
        this.instructorRepository = instructorRepository;
        this.notificationService = notificationService;
    }

    // ================= REGISTER =================
    @PostMapping
    public ResponseEntity<CandidateResponse> register(@RequestBody CandidateRequest request) {
        return ResponseEntity.ok(service.registerCandidate(request));
    }

    // ================= GET ALL (role-aware) =================
    // ADMIN / PASTOR  → all candidates
    // INSTRUCTOR      → only their assigned candidates (resolved from JWT email)
    // CANDIDATE       → only themselves
    @GetMapping
    public ResponseEntity<List<CandidateResponse>> getAll(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.ok(service.getAllCandidates());
        }

        String email = authentication.getName(); // email stored as principal in JWT
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(service.getAllCandidates());
        }

        if (user.getRole() == Role.INSTRUCTOR) {
            // Resolve instructor profile from email, then return only their candidates
            return instructorRepository.findByEmail(email)
                    .map(instructor -> ResponseEntity.ok(
                            service.getCandidatesByInstructor(instructor.getId())))
                    .orElse(ResponseEntity.ok(List.of()));
        }

        if (user.getRole() == Role.CANDIDATE) {
            // Candidate sees only their own record
            return ResponseEntity.ok(service.getCandidatesByEmail(email));
        }

        if (user.getRole() == Role.FIRST_CHURCH_ELDER) {
            // FCE sees only candidates from their own church
            if (user.getChurch() != null) {
                return ResponseEntity.ok(service.getCandidatesByChurch(user.getChurch().getId()));
            }
            return ResponseEntity.ok(List.of());
        }

        // ADMIN, PASTOR, UNION_ADMIN → all candidates
        return ResponseEntity.ok(service.getAllCandidates());
    }

    // ================= GET BY EMAIL =================
    @GetMapping("/by-email/{email}")
    public ResponseEntity<List<CandidateResponse>> getByEmail(@PathVariable String email) {
        return ResponseEntity.ok(service.getCandidatesByEmail(email));
    }

    // ================= GET BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<CandidateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getCandidateById(id));
    }

    // ================= GET BY INSTRUCTOR =================
    @GetMapping("/by-instructor/{instructorId}")
    public ResponseEntity<List<CandidateResponse>> getByInstructor(
            @PathVariable Long instructorId) {
        return ResponseEntity.ok(service.getCandidatesByInstructor(instructorId));
    }

    // ================= GET UNASSIGNED =================
    @GetMapping("/unassigned")
    public ResponseEntity<List<CandidateResponse>> getUnassigned(
            @RequestParam(required = false) Long churchId) {
        return ResponseEntity.ok(service.getUnassignedCandidates(churchId));
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<CandidateResponse> update(
            @PathVariable Long id,
            @RequestBody CandidateRequest request) {
        return ResponseEntity.ok(service.updateCandidate(id, request));
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }

    // ================= ASSIGN INSTRUCTOR (single) =================
    @PatchMapping("/{candidateId}/assign-instructor/{instructorId}")
    public ResponseEntity<CandidateResponse> assignInstructor(
            @PathVariable Long candidateId,
            @PathVariable Long instructorId) {
        return ResponseEntity.ok(service.assignInstructor(candidateId, instructorId));
    }

    // ================= UNASSIGN INSTRUCTOR =================
    @PatchMapping("/{candidateId}/unassign-instructor")
    public ResponseEntity<CandidateResponse> unassignInstructor(
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(service.unassignInstructor(candidateId));
    }

    // ================= CANDIDATE DETAIL (with courses & baptism) =================
    @GetMapping("/{id}/detail")
    public ResponseEntity<CandidateDetailResponse> getDetail(@PathVariable Long id) {
        CandidateResponse cr = service.getCandidateById(id);
        List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(id);
        long completed = lessons.stream().filter(Lesson::isCompleted).count();
        double progress = lessons.isEmpty() ? 0 : (completed * 100.0 / lessons.size());

        List<LessonGradeResponse> grades = lessons.stream().map(lesson -> {
            List<LessonAttempt> attempts = attemptRepository
                    .findByLessonIdAndCandidateIdOrderByAttemptNumberAsc(lesson.getId(), id);
            int bestScore = attempts.stream().mapToInt(LessonAttempt::getScore).max().orElse(0);
            LessonGradeResponse g = new LessonGradeResponse();
            g.lessonId = lesson.getId();
            g.lessonTitle = lesson.getLessonTitle();
            g.candidateId = id;
            g.candidateName = cr.getFullName();
            g.candidateScore = lesson.getObtainedScore();
            g.requiredScore = lesson.getRequiredScore();
            g.completed = lesson.isCompleted();
            g.attemptsUsed = attempts.size();
            g.bestScore = bestScore;
            return g;
        }).collect(Collectors.toList());

        List<Baptism> baptisms = baptismRepository.findByCandidateId(id);
        Baptism baptism = baptisms.isEmpty() ? null : baptisms.get(baptisms.size() - 1);

        CandidateDetailResponse d = new CandidateDetailResponse();
        d.id = cr.getId();
        d.fullName = cr.getFullName();
        d.email = cr.getEmail();
        d.phone = cr.getPhone();
        d.gender = cr.getGender();
        d.address = cr.getAddress();
        d.dateOfBirth = cr.getDateOfBirth();
        d.status = cr.getStatus();
        d.churchId = cr.getChurchId();
        d.churchName = cr.getChurchName();
        d.instructorId = cr.getInstructorId();
        d.instructorName = cr.getInstructorName();
        d.instructorEmail = cr.getInstructorEmail();
        d.instructorPhone = cr.getInstructorPhone();
        d.totalLessons = lessons.size();
        d.completedLessons = (int) completed;
        d.progress = progress;
        d.grades = grades;

        if (baptism != null) {
            d.baptized = baptism.isBaptized();
            d.approved = baptism.isApproved();
            d.certificateSigned = baptism.isCertificateSigned();
            d.certificateNumber = baptism.getCertificateNumber();
            d.baptismId = baptism.getId();
        }

        return ResponseEntity.ok(d);
    }

    // ================= DASHBOARD (rich) =================
    @GetMapping("/dashboard/{candidateId}")
    public ResponseEntity<CandidateDashboardResponse> getDashboard(@PathVariable Long candidateId) {
        return ResponseEntity.ok(dashboardService.getDashboard(candidateId));
    }

    // ================= INSTRUCTOR APPROVE READY =================
    @PatchMapping("/{id}/approve-ready")
    public ResponseEntity<CandidateResponse> approveReady(@PathVariable Long id) {
        Candidate candidate = service.getCandidateEntity(id);

        // Check all lessons completed
        List<Lesson> lessons = lessonRepository.findByCandidateId(id);
        if (lessons.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        boolean allCompleted = lessons.stream().allMatch(Lesson::isCompleted);
        if (!allCompleted) {
            return ResponseEntity.badRequest().build();
        }

        // Check baptism registered and approved
        List<Baptism> baptisms = baptismRepository.findByCandidateId(id);
        boolean hasApprovedBaptism = baptisms.stream().anyMatch(Baptism::isApproved);
        if (!hasApprovedBaptism) {
            return ResponseEntity.badRequest().build();
        }

        candidate.setInstructorApproved(true);
        candidate.setStatus(Candidate.CandidateStatus.READY_FOR_BAPTISM);
        service.saveCandidate(candidate);

        // Notify candidate
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "You are ready for baptism!",
                "Your instructor has approved you for baptism. All courses completed and baptism registration approved.",
                com.church.baptism.entity.notification.Notification.NotificationType.SYSTEM)
        );

        return ResponseEntity.ok(service.mapToResponse(candidate));
    }

    // ================= CMS TRANSFER =================
    @PatchMapping("/{id}/cms-transfer")
    public ResponseEntity<CandidateResponse> cmsTransfer(@PathVariable Long id) {
        Candidate candidate = service.getCandidateEntity(id);
        if (candidate.getStatus() != Candidate.CandidateStatus.COURSE_COMPLETED) {
            return ResponseEntity.badRequest().build();
        }
        candidate.setStatus(Candidate.CandidateStatus.TRANSFERRED_TO_CMS);
        service.saveCandidate(candidate);

        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Transferred to CMS",
                "Your record has been transferred to the Church Management System.",
                com.church.baptism.entity.notification.Notification.NotificationType.SYSTEM)
        );

        return ResponseEntity.ok(service.mapToResponse(candidate));
    }

    // ================= CANDIDATE DETAIL (with courses & baptism) =================

    // ================= PROFILE PICTURE UPLOAD =================
    @PostMapping("/{id}/profile-picture")
    public ResponseEntity<CandidateResponse> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        // Find candidate by the authenticated user's email (user ID != candidate ID)
        String email = authentication.getName();
        Candidate candidate = candidateRepository.findByEmail(email).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Candidate profile not found for user: " + email));

        String ext = "";
        String orig = file.getOriginalFilename();
        if (orig != null && orig.contains(".")) {
            ext = orig.substring(orig.lastIndexOf("."));
        }
        String filename = "profile-" + id + "-" + UUID.randomUUID() + ext;

        Path storageDir = Paths.get(profilePicturePath).toAbsolutePath();
        Files.createDirectories(storageDir);
        Path filePath = storageDir.resolve(filename);
        file.transferTo(filePath.toFile());

        candidate.setProfilePicturePath("/api/candidates/profile-pictures/" + filename);
        service.saveCandidate(candidate);

        return ResponseEntity.ok(service.mapToResponse(candidate));
    }

    // ================= SERVE PROFILE PICTURE =================
    @GetMapping("/profile-pictures/{filename}")
    public ResponseEntity<byte[]> serveProfilePicture(@PathVariable String filename) throws IOException {
        Path filePath = Paths.get(profilePicturePath).toAbsolutePath().resolve(filename);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        byte[] data = Files.readAllBytes(filePath);
        String contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .body(data);
    }

    // ================= PROFILE UPDATE (candidate self) =================
    @PutMapping("/profile")
    public ResponseEntity<CandidateResponse> updateProfile(
            Authentication authentication,
            @RequestBody java.util.Map<String, String> body) {
        String email = authentication.getName();
        Candidate candidate = candidateRepository.findByEmail(email).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Candidate profile not found"));

        if (body.containsKey("fullName")) candidate.setFullName(body.get("fullName"));
        if (body.containsKey("phone")) candidate.setPhone(body.get("phone"));
        if (body.containsKey("email")) candidate.setEmail(body.get("email"));
        if (body.containsKey("gender")) candidate.setGender(body.get("gender"));
        if (body.containsKey("address")) candidate.setAddress(body.get("address"));
        if (body.containsKey("dateOfBirth")) {
            try {
                candidate.setDateOfBirth(java.time.LocalDate.parse(body.get("dateOfBirth")));
            } catch (Exception ignored) {}
        }
        service.saveCandidate(candidate);
        return ResponseEntity.ok(service.mapToResponse(candidate));
    }

    // ================= PREFERRED COURSE LANGUAGE =================
    @PutMapping("/course-language")
    public ResponseEntity<?> updateCourseLanguage(
            Authentication authentication,
            @RequestBody java.util.Map<String, String> body) {
        String email = authentication.getName();
        Candidate candidate = candidateRepository.findByEmail(email).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Candidate profile not found"));
        String lang = body.getOrDefault("preferredCourseLanguage", body.getOrDefault("language", "en"));
        candidate.setPreferredCourseLanguage(lang);
        service.saveCandidate(candidate);
        return ResponseEntity.ok(java.util.Map.of("preferredCourseLanguage", lang));
    }

    @GetMapping("/course-language")
    public ResponseEntity<?> getCourseLanguage(Authentication authentication) {
        String email = authentication.getName();
        Candidate candidate = candidateRepository.findByEmail(email).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Candidate profile not found"));
        return ResponseEntity.ok(java.util.Map.of("preferredCourseLanguage", candidate.getPreferredCourseLanguage() != null ? candidate.getPreferredCourseLanguage() : "en"));
    }
}