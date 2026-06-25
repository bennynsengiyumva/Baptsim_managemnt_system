package com.church.baptism.controller;

import com.church.baptism.dto.request.LessonRequest;
import com.church.baptism.dto.request.SubmitAttemptRequest;
import com.church.baptism.dto.response.LessonAttemptResponse;
import com.church.baptism.dto.response.LessonDocumentResponse;
import com.church.baptism.dto.response.LessonGradeResponse;
import com.church.baptism.dto.response.LessonResponse;
import com.church.baptism.service.lesson.LessonService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private static final Logger log = LoggerFactory.getLogger(LessonController.class);

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping("/create")
    public LessonResponse createLesson(
            @RequestParam String lessonTitle,
            @RequestParam(required = false) String lessonDate,
            @RequestParam(required = false, defaultValue = "") String notes,
            @RequestParam(required = false, defaultValue = "0") int requiredScore,
            @RequestParam(required = false, defaultValue = "0") int lessonOrder,
            @RequestParam(required = false, defaultValue = "3") int maxAttempts,
            @RequestParam(required = false) Long candidateId,
            @RequestParam(required = false) Long instructorId,
            @RequestParam(required = false) MultipartFile file
    ) {
        LessonRequest request = new LessonRequest();
        request.lessonTitle = lessonTitle;
        request.lessonDate = lessonDate != null ? LocalDate.parse(lessonDate) : null;
        request.notes = notes;
        request.requiredScore = requiredScore;
        request.lessonOrder = lessonOrder;
        request.maxAttempts = maxAttempts;
        request.candidateId = candidateId;
        request.instructorId = instructorId;

        log.info("createLesson: title={}, candidateId={}, instructorId={}, lessonOrder={}, requiredScore={}",
                request.lessonTitle, request.candidateId, request.instructorId,
                request.lessonOrder, request.requiredScore);
        if (request.candidateId == null) {
            throw new IllegalArgumentException("candidateId is required but was not received");
        }
        if (request.instructorId == null) {
            throw new IllegalArgumentException("instructorId is required but was not received");
        }
        return lessonService.createLesson(request, file);
    }

    @PutMapping("/{lessonId}")
    public LessonResponse updateLesson(
            @PathVariable Long lessonId,
            @RequestParam(required = false) String lessonTitle,
            @RequestParam(required = false) String lessonDate,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false, defaultValue = "0") Integer requiredScore,
            @RequestParam(required = false, defaultValue = "0") Integer lessonOrder,
            @RequestParam(required = false, defaultValue = "3") Integer maxAttempts,
            @RequestParam(required = false) Long candidateId,
            @RequestParam(required = false) Long instructorId,
            @RequestParam(required = false) MultipartFile file
    ) {
        LessonRequest request = new LessonRequest();
        request.lessonTitle = lessonTitle;
        request.lessonDate = lessonDate != null ? LocalDate.parse(lessonDate) : null;
        request.notes = notes;
        request.requiredScore = requiredScore != null ? requiredScore : 0;
        request.lessonOrder = lessonOrder != null ? lessonOrder : 0;
        request.maxAttempts = maxAttempts != null ? maxAttempts : 3;
        request.candidateId = candidateId;
        request.instructorId = instructorId;
        return lessonService.updateLesson(lessonId, request, file);
    }

    @DeleteMapping("/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{lessonId}/questions")
    public LessonResponse addQuestions(
            @PathVariable Long lessonId,
            @RequestBody List<LessonRequest.QuestionRequest> questions
    ) {
        return lessonService.addQuestions(lessonId, questions);
    }

    @PostMapping("/{lessonId}/start-attempt")
    public LessonAttemptResponse startAttempt(
            @PathVariable Long lessonId,
            @RequestParam Long candidateId
    ) {
        return lessonService.startAttempt(lessonId, candidateId);
    }

    @PostMapping("/{lessonId}/submit-attempt")
    public LessonAttemptResponse submitAttempt(
            @PathVariable Long lessonId,
            @RequestBody SubmitAttemptRequest body
    ) {
        return lessonService.submitAttempt(lessonId, body.candidateId, body.questionIds, body.answers);
    }

    @GetMapping
    public List<LessonResponse> getAll() {
        return lessonService.getAllLessons();
    }

    @GetMapping("/{id}")
    public LessonResponse getById(@PathVariable Long id,
                                  @RequestParam(defaultValue = "false") boolean includeAnswers) {
        return lessonService.getLessonById(id, includeAnswers);
    }

    @GetMapping("/by-instructor/{instructorId}")
    public List<LessonResponse> getByInstructor(@PathVariable Long instructorId) {
        return lessonService.getLessonsByInstructor(instructorId);
    }

    @GetMapping("/by-bible-study/{bibleStudyId}")
    public List<LessonResponse> getByBibleStudy(@PathVariable Long bibleStudyId) {
        return lessonService.getLessonsByBibleStudy(bibleStudyId);
    }

    @GetMapping("/by-candidate/{candidateId}")
    public List<LessonResponse> getByCandidate(@PathVariable Long candidateId) {
        return lessonService.getLessonsByCandidate(candidateId);
    }

    @GetMapping("/progress/{candidateId}")
    public double progress(@PathVariable Long candidateId) {
        return lessonService.getProgress(candidateId);
    }

    @GetMapping("/{lessonId}/attempts")
    public List<LessonAttemptResponse> getAttempts(
            @PathVariable Long lessonId,
            @RequestParam Long candidateId
    ) {
        return lessonService.getAttempts(lessonId, candidateId);
    }

    // ================= DOCUMENTS =================

    @PostMapping("/{lessonId}/documents")
    public LessonDocumentResponse uploadDocument(
            @PathVariable Long lessonId,
            @RequestParam MultipartFile file
    ) {
        return lessonService.uploadDocument(lessonId, file);
    }

    @GetMapping("/{lessonId}/documents")
    public List<LessonDocumentResponse> getDocuments(@PathVariable Long lessonId) {
        return lessonService.getDocuments(lessonId);
    }

    @DeleteMapping("/{lessonId}/documents/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) {
        lessonService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }

    // ================= GRADEBOOK =================

    @GetMapping("/grades/instructor/{instructorId}")
    public List<LessonGradeResponse> getGradebookByInstructor(@PathVariable Long instructorId) {
        return lessonService.getGradebookByInstructor(instructorId);
    }

    @GetMapping("/{lessonId}/grades")
    public List<LessonGradeResponse> getGradebookByLesson(@PathVariable Long lessonId) {
        return lessonService.getGradebookByLesson(lessonId);
    }
}
