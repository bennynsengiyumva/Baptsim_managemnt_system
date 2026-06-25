package com.church.baptism.controller;

import com.church.baptism.dto.request.CandidateRequest;
import com.church.baptism.dto.response.CandidateDetailResponse;
import com.church.baptism.dto.response.CandidateResponse;
import com.church.baptism.dto.response.CandidateDashboard;
import com.church.baptism.dto.response.LessonGradeResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.lesson.LessonAttempt;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.lesson.LessonAttemptRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.service.candidate.CandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/candidates")
@CrossOrigin(origins = "*")
public class CandidateController {

    private final CandidateService service;
    private final LessonRepository lessonRepository;
    private final LessonAttemptRepository attemptRepository;
    private final BaptismRepository baptismRepository;
    private final UserRepository userRepository;
    private final InstructorRepository instructorRepository;

    public CandidateController(CandidateService service,
                               LessonRepository lessonRepository,
                               LessonAttemptRepository attemptRepository,
                               BaptismRepository baptismRepository,
                               UserRepository userRepository,
                               InstructorRepository instructorRepository) {
        this.service = service;
        this.lessonRepository = lessonRepository;
        this.attemptRepository = attemptRepository;
        this.baptismRepository = baptismRepository;
        this.userRepository = userRepository;
        this.instructorRepository = instructorRepository;
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
            g.studentScore = lesson.getObtainedScore();
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

    // ================= DASHBOARD =================
    @GetMapping("/dashboard/{candidateId}")
    public ResponseEntity<CandidateDashboard> getDashboard(@PathVariable Long candidateId) {
        List<Lesson> lessons = lessonRepository.findByCandidateId(candidateId);
        long completed = lessons.stream().filter(Lesson::isCompleted).count();
        double progress = lessons.isEmpty() ? 0 : (completed * 100.0 / lessons.size());

        CandidateDashboard d = new CandidateDashboard();
        d.totalLessons = lessons.size();
        d.completedLessons = (int) completed;
        d.progress = progress;

        return ResponseEntity.ok(d);
    }
}