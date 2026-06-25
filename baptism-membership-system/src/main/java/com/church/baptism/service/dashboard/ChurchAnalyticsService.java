package com.church.baptism.service.dashboard;

import com.church.baptism.dto.dashboard.ChurchAnalyticsResponse;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChurchAnalyticsService {

    private final CandidateRepository candidateRepository;
    private final BaptismRepository baptismRepository;
    private final LessonRepository lessonRepository;

    public ChurchAnalyticsService(
            CandidateRepository candidateRepository,
            BaptismRepository baptismRepository,
            LessonRepository lessonRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.baptismRepository = baptismRepository;
        this.lessonRepository = lessonRepository;
    }

    public ChurchAnalyticsResponse getChurchAnalytics(String church) {

        long totalCandidates =
        candidateRepository.countByChurch_ChurchName(church);

long baptizedCandidates =
        baptismRepository.countByCandidate_Church_ChurchName(church);

List<Lesson> lessons =
        lessonRepository.findByCandidate_Church_ChurchName(church);

        long completedLessons = lessons.stream()
                .filter(Lesson::isCompleted)
                .count();

        double baptismRate = totalCandidates == 0
                ? 0
                : (baptizedCandidates * 100.0 / totalCandidates);

        ChurchAnalyticsResponse response =
                new ChurchAnalyticsResponse();

        response.churchName = church;
        response.totalCandidates = totalCandidates;
        response.baptizedCandidates = baptizedCandidates;
        response.baptismRate = baptismRate;
        response.totalLessonsCompleted = completedLessons;

        return response;
    }
}