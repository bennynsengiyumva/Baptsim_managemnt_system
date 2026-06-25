package com.church.baptism.controller;

import com.church.baptism.service.analytics.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/kpi-cards")
    public Map<String, Object> getKpiCards() {
        return analyticsService.getKpiCards();
    }

    @GetMapping("/baptism-stats")
    public Map<String, Object> getBaptismStats(
            @RequestParam(defaultValue = "MONTHLY") String period,
            @RequestParam(required = false) Integer year) {
        if (year == null) year = java.time.LocalDate.now().getYear();
        return analyticsService.getBaptismStats(period, year);
    }

    @GetMapping("/candidate-progress")
    public List<Map<String, Object>> getCandidateProgress() {
        return analyticsService.getCandidateProgress();
    }

    @GetMapping("/lesson-completion")
    public Map<String, Object> getLessonCompletionRates() {
        return analyticsService.getLessonCompletionRates();
    }

    @GetMapping("/instructor-performance")
    public List<Map<String, Object>> getInstructorPerformance() {
        return analyticsService.getInstructorPerformance();
    }

    @GetMapping("/church-trends")
    public List<Map<String, Object>> getChurchBaptismTrends() {
        return analyticsService.getChurchBaptismTrends();
    }

    @GetMapping("/demographics")
    public Map<String, Object> getDemographicAnalysis() {
        return analyticsService.getDemographicAnalysis();
    }

    @GetMapping("/retention-growth")
    public Map<String, Object> getRetentionAndGrowth() {
        return analyticsService.getRetentionAndGrowth();
    }
}
