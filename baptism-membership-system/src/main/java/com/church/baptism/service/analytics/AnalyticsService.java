package com.church.baptism.service.analytics;

import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final CandidateRepository candidateRepository;
    private final BaptismRepository baptismRepository;
    private final LessonRepository lessonRepository;
    private final ChurchRepository churchRepository;
    private final InstructorRepository instructorRepository;

    public AnalyticsService(
            CandidateRepository candidateRepository,
            BaptismRepository baptismRepository,
            LessonRepository lessonRepository,
            ChurchRepository churchRepository,
            InstructorRepository instructorRepository
    ) {
        this.candidateRepository = candidateRepository;
        this.baptismRepository = baptismRepository;
        this.lessonRepository = lessonRepository;
        this.churchRepository = churchRepository;
        this.instructorRepository = instructorRepository;
    }

    // ===================== KPI CARDS =====================

    public Map<String, Object> getKpiCards() {
        Map<String, Object> kpis = new HashMap<>();
        List<Candidate> all = candidateRepository.findAll();
        List<Baptism> baptisms = baptismRepository.findAll();
        List<Lesson> lessons = lessonRepository.findAll();

        long totalCandidates = all.size();
        long baptized = all.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
        long inProgress = all.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS).count();
        long registered = all.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.REGISTERED).count();

        long totalLessons = lessons.size();
        long completedLessons = lessons.stream().filter(Lesson::isCompleted).count();
        double completionRate = totalLessons > 0 ? (completedLessons * 100.0 / totalLessons) : 0;

        long totalInstructors = instructorRepository.count();
        long totalChurches = churchRepository.count();

        long thisMonthBaptisms = baptisms.stream()
                .filter(b -> b.isBaptized() && b.getConfirmedAt() != null
                        && b.getConfirmedAt().toLocalDate().getMonth() == LocalDate.now().getMonth()
                        && b.getConfirmedAt().toLocalDate().getYear() == LocalDate.now().getYear())
                .count();

        kpis.put("totalCandidates", totalCandidates);
        kpis.put("baptized", baptized);
        kpis.put("inProgress", inProgress);
        kpis.put("registered", registered);
        kpis.put("totalLessons", totalLessons);
        kpis.put("completedLessons", completedLessons);
        kpis.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
        kpis.put("totalInstructors", totalInstructors);
        kpis.put("totalChurches", totalChurches);
        kpis.put("thisMonthBaptisms", thisMonthBaptisms);

        return kpis;
    }

    // ===================== BAPTISM STATS =====================

    public Map<String, Object> getBaptismStats(String period, int year) {
        Map<String, Object> stats = new HashMap<>();
        List<Baptism> baptized = baptismRepository.findAll().stream()
                .filter(Baptism::isBaptized)
                .collect(Collectors.toList());

        List<Map<String, Object>> trends = new ArrayList<>();
        if ("MONTHLY".equals(period)) {
            for (Month m : Month.values()) {
                long count = baptized.stream()
                        .filter(b -> b.getConfirmedAt() != null
                                && b.getConfirmedAt().getMonth() == m
                                && b.getConfirmedAt().getYear() == year)
                        .count();
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", m.name().substring(0, 3));
                entry.put("value", count);
                trends.add(entry);
            }
        } else if ("QUARTERLY".equals(period)) {
            for (int q = 1; q <= 4; q++) {
                int startMonth = (q - 1) * 3 + 1;
                int endMonth = q * 3;
                long count = baptized.stream()
                        .filter(b -> b.getConfirmedAt() != null
                                && b.getConfirmedAt().getYear() == year
                                && b.getConfirmedAt().getMonthValue() >= startMonth
                                && b.getConfirmedAt().getMonthValue() <= endMonth)
                        .count();
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", "Q" + q);
                entry.put("value", count);
                trends.add(entry);
            }
        } else {
            int startYear = year - 4;
            for (int y = startYear; y <= year; y++) {
                final int yf = y;
                long count = baptized.stream()
                        .filter(b -> b.getConfirmedAt() != null && b.getConfirmedAt().getYear() == yf)
                        .count();
                Map<String, Object> entry = new HashMap<>();
                entry.put("label", String.valueOf(y));
                entry.put("value", count);
                trends.add(entry);
            }
        }

        stats.put("trends", trends);
        stats.put("totalBaptized", baptized.size());
        stats.put("thisYear", baptized.stream().filter(b -> b.getConfirmedAt() != null && b.getConfirmedAt().getYear() == year).count());

        return stats;
    }

    // ===================== CANDIDATE PROGRESS =====================

    public List<Map<String, Object>> getCandidateProgress() {
        List<Candidate> candidates = candidateRepository.findAll();
        return candidates.stream().map(c -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", c.getId());
            entry.put("name", c.getFullName());
            entry.put("status", c.getStatus().name());
            entry.put("church", c.getChurch() != null ? c.getChurch().getChurchName() : null);

            List<Lesson> lessons = lessonRepository.findByCandidateId(c.getId());
            long completed = lessons.stream().filter(Lesson::isCompleted).count();
            entry.put("totalLessons", lessons.size());
            entry.put("completedLessons", completed);
            entry.put("progress", lessons.isEmpty() ? 0 : Math.round(completed * 100.0 / lessons.size()));

            return entry;
        }).collect(Collectors.toList());
    }

    // ===================== LESSON COMPLETION RATES =====================

    public Map<String, Object> getLessonCompletionRates() {
        List<Lesson> all = lessonRepository.findAll();
        long total = all.size();
        long completed = all.stream().filter(Lesson::isCompleted).count();
        long inProgress = all.stream().filter(l -> !l.isCompleted() && l.getObtainedScore() > 0).count();
        long notStarted = all.stream().filter(l -> !l.isCompleted() && l.getObtainedScore() == 0).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("completed", completed);
        stats.put("inProgress", inProgress);
        stats.put("notStarted", notStarted);
        stats.put("completionRate", total > 0 ? Math.round(completed * 100.0 / total * 10.0) / 10.0 : 0);

        return stats;
    }

    // ===================== INSTRUCTOR PERFORMANCE =====================

    public List<Map<String, Object>> getInstructorPerformance() {
        List<Instructor> instructors = instructorRepository.findAll();
        return instructors.stream().map(instr -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", instr.getId());
            entry.put("name", instr.getFullName());
            entry.put("email", instr.getEmail());
            entry.put("church", instr.getChurch() != null ? instr.getChurch().getChurchName() : null);

            List<Candidate> assigned = candidateRepository.findByInstructorId(instr.getId());
            entry.put("totalCandidates", assigned.size());

            long baptized = assigned.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count();
            entry.put("baptized", baptized);

            long completedLessons = 0;
            long totalLessons = 0;
            for (Candidate c : assigned) {
                List<Lesson> lessons = lessonRepository.findByCandidateId(c.getId());
                totalLessons += lessons.size();
                completedLessons += lessons.stream().filter(Lesson::isCompleted).count();
            }
            entry.put("totalLessons", totalLessons);
            entry.put("completedLessons", completedLessons);
            entry.put("completionRate", totalLessons > 0 ? Math.round(completedLessons * 100.0 / totalLessons * 10.0) / 10.0 : 0);

            return entry;
        }).collect(Collectors.toList());
    }

    // ===================== CHURCH-WISE BAPTISM TRENDS =====================

    public List<Map<String, Object>> getChurchBaptismTrends() {
        List<Church> churches = churchRepository.findAll();
        List<Baptism> baptized = baptismRepository.findAll().stream()
                .filter(Baptism::isBaptized)
                .collect(Collectors.toList());

        return churches.stream().map(ch -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", ch.getId());
            entry.put("name", ch.getChurchName());
            entry.put("district", ch.getDistrict() != null ? ch.getDistrict().getName() : null);
            entry.put("unionName", ch.getDistrict() != null && ch.getDistrict().getField() != null
                    && ch.getDistrict().getField().getUnion() != null
                    ? ch.getDistrict().getField().getUnion().getName() : null);

            long totalCandidates = candidateRepository.findAll().stream()
                    .filter(c -> c.getChurch() != null && c.getChurch().getId().equals(ch.getId()))
                    .count();
            entry.put("totalCandidates", totalCandidates);

            long churchBaptized = baptized.stream()
                    .filter(b -> b.getCandidate().getChurch() != null
                            && b.getCandidate().getChurch().getId().equals(ch.getId()))
                    .count();
            entry.put("baptized", churchBaptized);
            entry.put("baptismRate", totalCandidates > 0 ? Math.round(churchBaptized * 100.0 / totalCandidates * 10.0) / 10.0 : 0);

            return entry;
        }).collect(Collectors.toList());
    }

    // ===================== DEMOGRAPHIC ANALYSIS =====================

    public Map<String, Object> getDemographicAnalysis() {
        List<Candidate> all = candidateRepository.findAll();

        Map<String, Long> genderDist = all.stream()
                .filter(c -> c.getGender() != null)
                .collect(Collectors.groupingBy(Candidate::getGender, Collectors.counting()));

        Map<String, Long> statusDist = all.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus().name(), Collectors.counting()));

        long withInstructor = all.stream().filter(c -> c.getInstructor() != null).count();
        long withoutInstructor = all.size() - withInstructor;

        double avgAge = all.stream()
                .filter(c -> c.getDateOfBirth() != null)
                .mapToLong(c -> ChronoUnit.YEARS.between(c.getDateOfBirth(), LocalDate.now()))
                .average()
                .orElse(0);

        Map<String, Object> demo = new HashMap<>();
        demo.put("genderDistribution", genderDist);
        demo.put("statusDistribution", statusDist);
        demo.put("totalCandidates", all.size());
        demo.put("withInstructor", withInstructor);
        demo.put("withoutInstructor", withoutInstructor);
        demo.put("averageAge", Math.round(avgAge * 10.0) / 10.0);

        return demo;
    }

    // ===================== RETENTION & GROWTH =====================

    public Map<String, Object> getRetentionAndGrowth() {
        List<Candidate> all = candidateRepository.findAll();
        List<Baptism> baptized = baptismRepository.findAll().stream()
                .filter(Baptism::isBaptized)
                .collect(Collectors.toList());

        int currentYear = LocalDate.now().getYear();
        Map<String, Object> growth = new HashMap<>();

        List<Map<String, Object>> yearlyGrowth = new ArrayList<>();
        List<Baptism> allBaptisms = baptismRepository.findAll().stream()
                .filter(Baptism::isBaptized)
                .collect(Collectors.toList());
        for (int y = currentYear - 4; y <= currentYear; y++) {
            final int year = y;
            Map<String, Object> entry = new HashMap<>();
            entry.put("year", year);
            long yearBaptisms = allBaptisms.stream()
                    .filter(b -> b.getConfirmedAt() != null && b.getConfirmedAt().getYear() == year)
                    .count();
            entry.put("baptisms", yearBaptisms);
            yearlyGrowth.add(entry);
        }
        growth.put("yearlyGrowth", yearlyGrowth);

        long retention = all.stream()
                .filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED
                        || c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS)
                .count();
        growth.put("activeCandidates", retention);
        growth.put("retentionRate", all.isEmpty() ? 0 : Math.round(retention * 100.0 / all.size() * 10.0) / 10.0);
        growth.put("churned", all.size() - retention);

        return growth;
    }
}
