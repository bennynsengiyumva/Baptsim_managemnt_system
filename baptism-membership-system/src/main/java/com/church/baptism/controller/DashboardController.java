package com.church.baptism.controller;

import com.church.baptism.dto.dashboard.CandidateDashboard;
import com.church.baptism.dto.dashboard.DashboardStatsDTO;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.spiritual.SpiritualPreparationRepository;
import com.church.baptism.service.dashboard.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin("*")
public class DashboardController {

    private final DashboardService dashboardService;
    private final LessonRepository lessonRepository;
    private final SpiritualPreparationRepository spiritualRepository;

    public DashboardController(
            DashboardService dashboardService,
            LessonRepository lessonRepository,
            SpiritualPreparationRepository spiritualRepository
    ) {
        this.dashboardService = dashboardService;
        this.lessonRepository = lessonRepository;
        this.spiritualRepository = spiritualRepository;
    }

    // =====================================
    // GLOBAL DASHBOARD STATS
    // =====================================
    @GetMapping("/stats")
    public DashboardStatsDTO getStats() {
        return dashboardService.getStats();
    }

    // =====================================
    // ADMIN DASHBOARD
    // =====================================
    @GetMapping("/admin")
public DashboardStatsDTO adminDashboard() {
    return dashboardService.getStats();
}

    // =====================================
    // PASTOR DASHBOARD
    // =====================================
    @GetMapping("/pastor")
    public String pastorDashboard() {
        return "Pastor: church-level candidates and baptism planning";
    }

    // =====================================
    // INSTRUCTOR DASHBOARD
    // =====================================
    @GetMapping("/instructor")
    public String instructorDashboard() {
        return "Instructor: assigned candidates and lesson progress";
    }

    // =====================================
    // CANDIDATE DASHBOARD
    // =====================================
    @GetMapping("/candidate/{candidateId}")
    public CandidateDashboard getCandidateDashboard(
            @PathVariable Long candidateId
    ) {

        List<Lesson> lessons =
                lessonRepository.findByCandidateId(candidateId);

        long completedLessons = lessons.stream()
                .filter(Lesson::isCompleted)
                .count();

        double lessonProgress = lessons.isEmpty()
                ? 0
                : (completedLessons * 100.0 / lessons.size());

        boolean spirituallyReady = spiritualRepository
                .findByCandidateId(candidateId)
                .stream()
                .allMatch(s -> s.isReadyForBaptism());

        CandidateDashboard d = new CandidateDashboard();

        d.totalLessons = lessons.size();
        d.completedLessons = (int) completedLessons;
        d.lessonProgress = lessonProgress;
        d.spirituallyReady = spirituallyReady;
        d.overallReady =
                spirituallyReady && lessonProgress >= 70;

        return d;
    }
}