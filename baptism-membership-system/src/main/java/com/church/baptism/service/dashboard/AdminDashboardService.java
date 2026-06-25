package com.church.baptism.service.dashboard;

import com.church.baptism.dto.response.AdminDashboardResponse;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.spiritual.SpiritualPreparation;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.spiritual.SpiritualPreparationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminDashboardService {

    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final SpiritualPreparationRepository spiritualRepository;
    private final BaptismRepository baptismRepository;

    public AdminDashboardService(
            CandidateRepository candidateRepository,
            LessonRepository lessonRepository,
            SpiritualPreparationRepository spiritualRepository,
            BaptismRepository baptismRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.lessonRepository = lessonRepository;
        this.spiritualRepository = spiritualRepository;
        this.baptismRepository = baptismRepository;
    }

    public AdminDashboardResponse getDashboard() {

        List<Candidate> candidates = candidateRepository.findAll();
        List<Lesson> lessons = lessonRepository.findAll();
        List<SpiritualPreparation> spirituals = spiritualRepository.findAll();
        List<Baptism> baptisms = baptismRepository.findAll();

        // ================= CANDIDATES =================
        long totalCandidates = candidates.size();

        long readyCandidates = spirituals.stream()
                .map(SpiritualPreparation::getCandidate)
                .distinct()
                .filter(c -> spiritualRepository.findByCandidateId(c.getId())
                        .stream()
                        .allMatch(SpiritualPreparation::isReadyForBaptism))
                .count();

        // ================= LESSONS =================
        double lessonCompletionRate = lessons.isEmpty()
                ? 0
                : (lessons.stream().filter(Lesson::isCompleted).count() * 100.0 / lessons.size());

        // ================= SPIRITUAL =================
        double spiritualRate = spirituals.isEmpty()
                ? 0
                : (spirituals.stream().filter(SpiritualPreparation::isReadyForBaptism).count()
                * 100.0 / spirituals.size());

        // ================= BAPTISM =================
        long totalBaptisms = baptisms.size();

        long baptized = baptisms.stream()
                .filter(Baptism::isBaptized)
                .count();

        long pending = baptisms.stream()
                .filter(b -> !b.isApproved())
                .count();

        // ================= OVERALL =================
        double overall = (lessonCompletionRate + spiritualRate) / 2;

        String status =
                overall >= 80 ? "Healthy" :
                overall >= 50 ? "Growing" :
                "Needs Attention";

        // ================= RESPONSE =================
        AdminDashboardResponse r = new AdminDashboardResponse();

        r.totalCandidates = totalCandidates;
        r.activeCandidates = totalCandidates; // can refine later
        r.readyForBaptism = readyCandidates;

        r.averageLessonCompletionRate = lessonCompletionRate;
        r.averageSpiritualReadiness = spiritualRate;

        r.totalBaptisms = totalBaptisms;
        r.baptizedCandidates = baptized;
        r.pendingApprovals = pending;

        r.overallReadinessRate = overall;
        r.systemStatus = status;

        return r;
    }
}