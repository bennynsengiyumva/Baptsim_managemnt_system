package com.church.baptism.service.candidate;

import com.church.baptism.dto.response.CandidateDashboardResponse;
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
public class CandidateDashboardService {

    private final CandidateRepository candidateRepository;
    private final LessonRepository lessonRepository;
    private final SpiritualPreparationRepository spiritualRepository;
    private final BaptismRepository baptismRepository;

    public CandidateDashboardService(
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

    public CandidateDashboardResponse getDashboard(Long candidateId) {

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        List<Lesson> lessons = lessonRepository.findByCandidateId(candidateId);

        int totalLessons = lessons.size();

        int completedLessons = (int) lessons.stream()
                .filter(Lesson::isCompleted)
                .count();

        double lessonProgress = totalLessons == 0
                ? 0
                : (completedLessons * 100.0 / totalLessons);

        List<SpiritualPreparation> spiritualActivities =
                spiritualRepository.findByCandidateId(candidateId);

        int totalSpiritualActivities = spiritualActivities.size();

        int readyActivities = (int) spiritualActivities.stream()
                .filter(SpiritualPreparation::isReadyForBaptism)
                .count();

        double spiritualProgress = totalSpiritualActivities == 0
                ? 0
                : (readyActivities * 100.0 / totalSpiritualActivities);

        boolean spirituallyReady = spiritualActivities.stream()
                .allMatch(SpiritualPreparation::isReadyForBaptism);

        Baptism baptism = baptismRepository.findAll()
                .stream()
                .filter(b -> b.getCandidate().getId().equals(candidateId))
                .findFirst()
                .orElse(null);

        boolean baptized = baptism != null && baptism.isBaptized();
        boolean approved = baptism != null && baptism.isApproved();

        boolean readyForBaptism =
                lessonProgress >= 100 && spirituallyReady;

        double overallReadiness =
                (lessonProgress + spiritualProgress) / 2;

        CandidateDashboardResponse response =
                new CandidateDashboardResponse();

        response.candidateId = candidateId;
        response.candidateName = candidate.getFullName();

        response.totalLessons = totalLessons;
        response.completedLessons = completedLessons;
        response.lessonProgress = lessonProgress;

        response.totalSpiritualActivities = totalSpiritualActivities;
        response.readyActivities = readyActivities;
        response.spiritualProgress = spiritualProgress;

        response.readyForBaptism = readyForBaptism;
        response.baptized = baptized;
        response.approved = approved;

        response.overallReadiness = overallReadiness;

        if (baptized) {
            response.statusMessage = "Baptized Member";
        } else if (readyForBaptism) {
            response.statusMessage = "Ready for Baptism";
        } else {
            response.statusMessage = "In Preparation";
        }

        return response;
    }
}