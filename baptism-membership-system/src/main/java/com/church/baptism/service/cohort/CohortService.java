package com.church.baptism.service.cohort;

import com.church.baptism.dto.request.CohortRequest;
import com.church.baptism.dto.response.CohortMemberResponse;
import com.church.baptism.dto.response.CohortResponse;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.cohort.Cohort;
import com.church.baptism.entity.cohort.CohortMember;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.cohort.CohortMemberRepository;
import com.church.baptism.repository.cohort.CohortRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.lesson.LessonService;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CohortService {

    private final CohortRepository cohortRepository;
    private final CohortMemberRepository memberRepository;
    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final LessonService lessonService;
    private final NotificationService notificationService;

    public CohortService(CohortRepository cohortRepository,
                         CohortMemberRepository memberRepository,
                         CandidateRepository candidateRepository,
                         InstructorRepository instructorRepository,
                         ChurchRepository churchRepository,
                         UserRepository userRepository,
                         LessonRepository lessonRepository,
                         LessonService lessonService,
                         NotificationService notificationService) {
        this.cohortRepository = cohortRepository;
        this.memberRepository = memberRepository;
        this.candidateRepository = candidateRepository;
        this.instructorRepository = instructorRepository;
        this.churchRepository = churchRepository;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.lessonService = lessonService;
        this.notificationService = notificationService;
    }

    @Transactional
    public CohortResponse createCohort(CohortRequest request) {
        if (cohortRepository.existsByCohortCode(request.getCohortCode())) {
            throw new RuntimeException("Cohort code already exists");
        }

        Cohort cohort = new Cohort();
        cohort.setCohortName(request.getCohortName());
        cohort.setCohortCode(request.getCohortCode());
        cohort.setDescription(request.getDescription());
        cohort.setLanguage(request.getLanguage() != null ? request.getLanguage() : "en");
        cohort.setCapacity(request.getCapacity());
        cohort.setStatus(Cohort.CohortStatus.ACTIVE);

        if (request.getStartDate() != null) {
            cohort.setStartDate(LocalDate.parse(request.getStartDate()));
        }
        if (request.getEndDate() != null) {
            cohort.setEndDate(LocalDate.parse(request.getEndDate()));
        }
        if (request.getInstructorId() != null) {
            Instructor instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
            cohort.setInstructor(instructor);
        }

        // Auto-set church from instructor if not provided
        if (cohort.getChurch() == null && request.getInstructorId() != null) {
            Instructor instructor = cohort.getInstructor();
            if (instructor == null) {
                instructor = instructorRepository.findById(request.getInstructorId()).orElse(null);
            }
            if (instructor != null && instructor.getChurch() != null) {
                cohort.setChurch(instructor.getChurch());
            }
        }

        cohortRepository.save(cohort);
        return mapToResponse(cohort);
    }

    @Transactional
    public CohortResponse updateCohort(Long id, CohortRequest request) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        if (request.getCohortName() != null) cohort.setCohortName(request.getCohortName());
        if (request.getDescription() != null) cohort.setDescription(request.getDescription());
        if (request.getLanguage() != null) cohort.setLanguage(request.getLanguage());
        if (request.getCapacity() != null) cohort.setCapacity(request.getCapacity());
        if (request.getStartDate() != null) cohort.setStartDate(LocalDate.parse(request.getStartDate()));
        if (request.getEndDate() != null) cohort.setEndDate(LocalDate.parse(request.getEndDate()));
        if (request.getStatus() != null) {
            try {
                Cohort.CohortStatus newStatus = Cohort.CohortStatus.valueOf(request.getStatus());
                cohort.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid status: " + request.getStatus());
            }
        }
        if (request.getChurchId() != null) {
            Church church = churchRepository.findById(request.getChurchId())
                    .orElseThrow(() -> new RuntimeException("Church not found"));
            cohort.setChurch(church);
        }
        if (request.getInstructorId() != null) {
            Instructor instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
            cohort.setInstructor(instructor);
        }

        cohortRepository.save(cohort);
        return mapToResponse(cohort);
    }

    public List<CohortResponse> getCohortsByInstructor(Long instructorId) {
        return cohortRepository.findByInstructorId(instructorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CohortResponse> getCohortsByChurch(Long churchId) {
        return cohortRepository.findByChurchId(churchId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CohortResponse> getAllCohorts() {
        return cohortRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CohortResponse getCohortById(Long id) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        return mapToResponse(cohort);
    }

    @Transactional
    public void deleteCohort(Long id) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        if (cohort.getStatus() != Cohort.CohortStatus.DRAFT) {
            throw new RuntimeException("Only draft cohorts can be deleted");
        }
        cohortRepository.deleteById(id);
    }

    @Transactional
    public CohortMemberResponse enrollCandidate(Long cohortId, Long candidateId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        if (cohort.getStatus() != Cohort.CohortStatus.ACTIVE) {
            throw new RuntimeException("Only active cohorts can receive new candidates");
        }

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        if (memberRepository.existsByCohortIdAndCandidateId(cohortId, candidateId)) {
            throw new RuntimeException("Candidate already enrolled in this cohort");
        }

        if (cohort.getCapacity() != null) {
            long enrolledCount = memberRepository.countByCohortIdAndStatus(cohortId, CohortMember.EnrollmentStatus.ENROLLED)
                    + memberRepository.countByCohortIdAndStatus(cohortId, CohortMember.EnrollmentStatus.APPROVED);
            if (enrolledCount >= cohort.getCapacity()) {
                throw new RuntimeException("Cohort is at full capacity");
            }
        }

        // Check candidate is not in another active cohort
        List<CohortMember> existingMembers = memberRepository.findByCandidateId(candidateId);
        for (CohortMember m : existingMembers) {
            if (m.getStatus() == CohortMember.EnrollmentStatus.ENROLLED || m.getStatus() == CohortMember.EnrollmentStatus.APPROVED) {
                if (!m.getCohort().getId().equals(cohortId)) {
                    throw new RuntimeException("Candidate is already enrolled in another active cohort");
                }
            }
        }

        CohortMember member = new CohortMember();
        member.setCohort(cohort);
        member.setCandidate(candidate);
        member.setStatus(CohortMember.EnrollmentStatus.ENROLLED);
        member.setEnrolledAt(LocalDateTime.now());
        memberRepository.save(member);

        return mapToMemberResponse(member);
    }

    @Transactional
    public CohortMemberResponse approveEnrollment(Long cohortId, Long candidateId) {
        CohortMember member = memberRepository.findByCohortIdAndCandidateId(cohortId, candidateId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        member.setStatus(CohortMember.EnrollmentStatus.APPROVED);
        member.setApprovedAt(LocalDateTime.now());
        memberRepository.save(member);

        // Auto-assign existing cohort lessons to the newly approved member
        Candidate candidate = member.getCandidate();
        lessonService.createLessonsForNewMember(cohortId, candidate);

        // Notify candidate
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "Cohort Enrollment Approved",
                "Your enrollment in cohort \"" + member.getCohort().getCohortName() + "\" has been approved.",
                com.church.baptism.entity.notification.Notification.NotificationType.SYSTEM)
        );

        return mapToMemberResponse(member);
    }

    @Transactional
    public List<CohortMemberResponse> bulkEnroll(Long cohortId, List<Long> candidateIds) {
        List<CohortMemberResponse> results = new ArrayList<>();
        for (Long candidateId : candidateIds) {
            try {
                results.add(enrollCandidate(cohortId, candidateId));
            } catch (RuntimeException e) {
                // Skip candidates that fail enrollment
            }
        }
        return results;
    }

    @Transactional
    public List<CohortMemberResponse> autoAssignEligible(Long cohortId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        if (cohort.getChurch() == null) {
            throw new RuntimeException("Cohort must be associated with a church for auto-assignment");
        }

        List<Candidate> unassigned = candidateRepository.findByInstructorIsNullAndChurchId(cohort.getChurch().getId());
        List<CohortMemberResponse> results = new ArrayList<>();

        for (Candidate candidate : unassigned) {
            try {
                results.add(enrollCandidate(cohortId, candidate.getId()));
            } catch (RuntimeException e) {
                // Skip candidates that fail enrollment
            }
        }
        return results;
    }

    @Transactional
    public void withdrawCandidate(Long cohortId, Long candidateId) {
        CohortMember member = memberRepository.findByCohortIdAndCandidateId(cohortId, candidateId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        member.setStatus(CohortMember.EnrollmentStatus.WITHDRAWN);
        memberRepository.save(member);

        // Remove instructor assignment from candidate
        Candidate candidate = member.getCandidate();
        if (candidate.getInstructor() != null) {
            candidate.setInstructor(null);
            candidateRepository.save(candidate);

            // Notify candidate
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Removed from Cohort",
                    "You have been removed from cohort \"" + member.getCohort().getCohortName() + "\". Your instructor assignment has been cleared.",
                    com.church.baptism.entity.notification.Notification.NotificationType.SYSTEM)
            );
        }
    }

    public Map<String, Object> getCohortProgress(Long cohortId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        List<CohortMember> members = memberRepository.findByCohortIdAndStatus(cohortId, CohortMember.EnrollmentStatus.APPROVED);
        int totalMembers = members.size();
        int completedMembers = 0;

        for (CohortMember member : members) {
            List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(member.getCandidate().getId());
            if (!lessons.isEmpty() && lessons.stream().allMatch(Lesson::isCompleted)) {
                completedMembers++;
            }
        }

        return Map.of(
                "cohortId", cohortId,
                "cohortName", cohort.getCohortName(),
                "totalMembers", totalMembers,
                "completedMembers", completedMembers,
                "activeMembers", totalMembers - completedMembers,
                "completionRate", totalMembers > 0 ? (completedMembers * 100.0 / totalMembers) : 0
        );
    }

    public List<Map<String, Object>> getCohortReport(Long cohortId) {
        List<CohortMember> members = memberRepository.findByCohortIdAndStatus(cohortId, CohortMember.EnrollmentStatus.APPROVED);
        List<Map<String, Object>> report = new ArrayList<>();

        for (CohortMember member : members) {
            Candidate candidate = member.getCandidate();
            List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(candidate.getId());
            long completed = lessons.stream().filter(Lesson::isCompleted).count();
            int total = lessons.size();
            double progress = total > 0 ? (completed * 100.0 / total) : 0;

            report.add(Map.of(
                    "candidateId", candidate.getId(),
                    "candidateName", candidate.getFullName(),
                    "completedLessons", completed,
                    "totalLessons", total,
                    "progressPercentage", progress,
                    "baptismStatus", candidate.getStatus() != null ? candidate.getStatus().name() : "UNKNOWN"
            ));
        }

        return report;
    }

    @Transactional
    public CohortMemberResponse assignCandidateToCohort(Long candidateId, Long instructorId, Long cohortId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        Instructor instructor = instructorRepository.findById(instructorId)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        if (cohort.getStatus() != Cohort.CohortStatus.ACTIVE) {
            throw new RuntimeException("Only active cohorts can receive new candidates");
        }

        if (!cohort.getInstructor().getId().equals(instructorId)) {
            throw new RuntimeException("Cohort does not belong to the selected instructor");
        }

        // Set instructor on candidate
        candidate.setInstructor(instructor);
        candidateRepository.save(candidate);

        // Create cohort member if not already enrolled
        if (!memberRepository.existsByCohortIdAndCandidateId(cohortId, candidateId)) {
            CohortMember member = new CohortMember();
            member.setCohort(cohort);
            member.setCandidate(candidate);
            member.setStatus(CohortMember.EnrollmentStatus.APPROVED);
            member.setEnrolledAt(LocalDateTime.now());
            member.setApprovedAt(LocalDateTime.now());
            memberRepository.save(member);

            // Auto-assign existing cohort lessons to the new member
            lessonService.createLessonsForNewMember(cohortId, candidate);

            // Notify candidate
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Cohort Assignment",
                    "You have been assigned to cohort \"" + cohort.getCohortName() + "\" under instructor " + instructor.getFullName() + ".",
                    com.church.baptism.entity.notification.Notification.NotificationType.SYSTEM)
            );

            return mapToMemberResponse(member);
        }

        // Already enrolled, just return existing
        CohortMember existing = memberRepository.findByCohortIdAndCandidateId(cohortId, candidateId).orElse(null);
        return existing != null ? mapToMemberResponse(existing) : null;
    }

    public List<CohortResponse> getActiveCohortsByChurch(Long churchId) {
        return cohortRepository.findByChurchIdAndStatus(churchId, Cohort.CohortStatus.ACTIVE)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getInstructorCohortStats(Long instructorId) {
        List<Cohort> allCohorts = cohortRepository.findByInstructorId(instructorId);
        long totalCohorts = allCohorts.size();
        long activeCohorts = allCohorts.stream().filter(c -> c.getStatus() == Cohort.CohortStatus.ACTIVE).count();
        long completedCohorts = allCohorts.stream().filter(c -> c.getStatus() == Cohort.CohortStatus.COMPLETED).count();

        int totalCandidates = 0;
        int completedCandidates = 0;
        for (Cohort cohort : allCohorts) {
            List<CohortMember> members = memberRepository.findByCohortId(cohort.getId());
            totalCandidates += members.size();
            completedCandidates += (int) members.stream()
                    .filter(m -> m.getStatus() == CohortMember.EnrollmentStatus.COMPLETED)
                    .count();
        }

        return Map.of(
                "totalCohorts", totalCohorts,
                "activeCohorts", activeCohorts,
                "completedCohorts", completedCohorts,
                "totalCandidates", totalCandidates,
                "completedCandidates", completedCandidates
        );
    }

    public Map<String, Object> getChurchCohortStats(Long churchId) {
        List<Cohort> allCohorts = cohortRepository.findByChurchId(churchId);
        long totalCohorts = allCohorts.size();
        long activeCohorts = allCohorts.stream().filter(c -> c.getStatus() == Cohort.CohortStatus.ACTIVE).count();

        int totalMembers = 0;
        for (Cohort cohort : allCohorts) {
            totalMembers += memberRepository.findByCohortId(cohort.getId()).size();
        }

        // Count candidates with and without instructor
        List<Candidate> allCandidates = candidateRepository.findByChurchId(churchId);
        long assignedCount = allCandidates.stream().filter(c -> c.getInstructor() != null).count();
        long unassignedCount = allCandidates.size() - assignedCount;

        return Map.of(
                "totalCandidates", allCandidates.size(),
                "assignedCandidates", assignedCount,
                "unassignedCandidates", unassignedCount,
                "totalCohorts", totalCohorts,
                "activeCohorts", activeCohorts,
                "totalMembers", totalMembers
        );
    }

    private CohortResponse mapToResponse(Cohort cohort) {
        CohortResponse r = new CohortResponse();
        r.setId(cohort.getId());
        r.setCohortName(cohort.getCohortName());
        r.setCohortCode(cohort.getCohortCode());
        r.setDescription(cohort.getDescription());
        r.setLanguage(cohort.getLanguage());
        r.setStartDate(cohort.getStartDate());
        r.setEndDate(cohort.getEndDate());
        r.setCapacity(cohort.getCapacity());
        r.setStatus(cohort.getStatus().name());
        r.setChurchId(cohort.getChurch() != null ? cohort.getChurch().getId() : null);
        r.setChurchName(cohort.getChurch() != null ? cohort.getChurch().getChurchName() : null);
        r.setInstructorId(cohort.getInstructor() != null ? cohort.getInstructor().getId() : null);
        r.setInstructorName(cohort.getInstructor() != null ? cohort.getInstructor().getFullName() : null);

        List<CohortMember> allMembers = memberRepository.findByCohortId(cohort.getId());
        r.setMemberCount(allMembers.size());
        r.setApprovedCount((int) allMembers.stream()
                .filter(m -> m.getStatus() == CohortMember.EnrollmentStatus.APPROVED)
                .count());

        List<CohortMemberResponse> memberResponses = allMembers.stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
        r.setMembers(memberResponses);

        return r;
    }

    private CohortMemberResponse mapToMemberResponse(CohortMember member) {
        CohortMemberResponse r = new CohortMemberResponse();
        r.setId(member.getId());
        r.setCandidateId(member.getCandidate().getId());
        r.setCandidateName(member.getCandidate().getFullName());
        r.setCandidateEmail(member.getCandidate().getEmail());
        r.setCandidateStatus(member.getCandidate().getStatus() != null ? member.getCandidate().getStatus().name() : null);
        r.setEnrollmentStatus(member.getStatus().name());
        r.setEnrolledAt(member.getEnrolledAt());
        r.setApprovedAt(member.getApprovedAt());

        List<Lesson> lessons = lessonRepository.findByCandidateIdOrderByLessonOrderAsc(member.getCandidate().getId());
        int total = lessons.size();
        int completed = (int) lessons.stream().filter(Lesson::isCompleted).count();
        r.setTotalLessons(total);
        r.setCompletedLessons(completed);
        r.setProgressPercentage(total > 0 ? (completed * 100.0 / total) : 0);

        return r;
    }
}
