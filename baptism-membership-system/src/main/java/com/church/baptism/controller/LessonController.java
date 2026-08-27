package com.church.baptism.controller;

import com.church.baptism.dto.request.LessonRequest;
import com.church.baptism.dto.request.SubmitAttemptRequest;
import com.church.baptism.dto.response.LessonAttemptResponse;
import com.church.baptism.dto.response.LessonDocumentResponse;
import com.church.baptism.dto.response.LessonGradeResponse;
import com.church.baptism.dto.response.LessonResponse;
import com.church.baptism.service.lesson.LessonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@Tag(name = "Lessons", description = "Course and lesson management endpoints")
public class LessonController {

    private static final Logger log = LoggerFactory.getLogger(LessonController.class);

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Create a new lesson/course")
    public LessonResponse createLesson(
            @RequestParam String lessonTitle,
            @RequestParam(required = false) String lessonDate,
            @RequestParam(required = false, defaultValue = "") String notes,
            @RequestParam(required = false, defaultValue = "0") int requiredScore,
            @RequestParam(required = false, defaultValue = "0") int lessonOrder,
            @RequestParam(required = false, defaultValue = "3") int maxAttempts,
            @RequestParam(required = false) Long candidateId,
            @RequestParam(required = false) Long cohortId,
            @RequestParam(required = false) Long instructorId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String titleRw,
            @RequestParam(required = false) String notesRw,
            @RequestParam(required = false) String descriptionRw,
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
        request.cohortId = cohortId;
        request.instructorId = instructorId;
        request.category = category;
        request.durationMinutes = durationMinutes;
        request.description = description;
        request.titleRw = titleRw;
        request.notesRw = notesRw;
        request.descriptionRw = descriptionRw;

        log.info("createLesson: title={}, candidateId={}, cohortId={}, instructorId={}, lessonOrder={}, requiredScore={}",
                request.lessonTitle, request.candidateId, request.cohortId, request.instructorId,
                request.lessonOrder, request.requiredScore);
        if (request.candidateId == null && request.cohortId == null) {
            throw new IllegalArgumentException("Either candidateId or cohortId is required");
        }
        if (request.instructorId == null) {
            throw new IllegalArgumentException("instructorId is required but was not received");
        }
        return lessonService.createLesson(request, file);
    }

    @PutMapping("/{lessonId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Update an existing lesson")
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
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer durationMinutes,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String titleRw,
            @RequestParam(required = false) String notesRw,
            @RequestParam(required = false) String descriptionRw,
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
        request.category = category;
        request.durationMinutes = durationMinutes;
        request.description = description;
        request.titleRw = titleRw;
        request.notesRw = notesRw;
        request.descriptionRw = descriptionRw;
        return lessonService.updateLesson(lessonId, request, file);
    }

    @DeleteMapping("/{lessonId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Delete a lesson")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{lessonId}/questions")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Add or replace assessment questions for a lesson")
    public LessonResponse addQuestions(
            @PathVariable Long lessonId,
            @RequestBody List<LessonRequest.QuestionRequest> questions
    ) {
        return lessonService.addQuestions(lessonId, questions);
    }

    @PostMapping("/{lessonId}/start-attempt")
    @Operation(summary = "Start an assessment attempt")
    public LessonAttemptResponse startAttempt(
            @PathVariable Long lessonId,
            @RequestParam Long candidateId
    ) {
        return lessonService.startAttempt(lessonId, candidateId);
    }

    @PostMapping("/{lessonId}/submit-attempt")
    @Operation(summary = "Submit assessment answers")
    public LessonAttemptResponse submitAttempt(
            @PathVariable Long lessonId,
            @RequestBody @Valid SubmitAttemptRequest body
    ) {
        return lessonService.submitAttempt(lessonId, body.candidateId, body.questionIds, body.answers);
    }

    @PostMapping("/{lessonId}/start-lesson")
    @Operation(summary = "Start a lesson (mark as in progress)")
    public LessonResponse startLesson(
            @PathVariable Long lessonId,
            @RequestParam Long candidateId
    ) {
        return lessonService.startLesson(lessonId, candidateId);
    }

    @PostMapping("/{lessonId}/content-complete")
    @Operation(summary = "Mark lesson content as read")
    public LessonResponse contentComplete(
            @PathVariable Long lessonId,
            @RequestParam Long candidateId
    ) {
        return lessonService.contentComplete(lessonId, candidateId);
    }

    @GetMapping("/progress-detail/{candidateId}")
    @Operation(summary = "Get detailed progress for a candidate")
    public java.util.Map<String, Object> progressDetail(@PathVariable Long candidateId) {
        return lessonService.getProgressDetail(candidateId);
    }

    @GetMapping
    @Operation(summary = "Get all lessons")
    public List<LessonResponse> getAll() {
        return lessonService.getAllLessons();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a lesson by ID")
    public LessonResponse getById(@PathVariable Long id,
                                  @RequestParam(defaultValue = "false") boolean includeAnswers,
                                  @RequestParam(required = false) String language) {
        return lessonService.getLessonById(id, includeAnswers, language);
    }

    @GetMapping("/by-instructor/{instructorId}")
    @Operation(summary = "Get lessons by instructor")
    public List<LessonResponse> getByInstructor(@PathVariable Long instructorId) {
        return lessonService.getLessonsByInstructor(instructorId);
    }

    @GetMapping("/by-bible-study/{bibleStudyId}")
    @Operation(summary = "Get lessons by Bible study")
    public List<LessonResponse> getByBibleStudy(@PathVariable Long bibleStudyId) {
        return lessonService.getLessonsByBibleStudy(bibleStudyId);
    }

    @GetMapping("/by-candidate/{candidateId}")
    @Operation(summary = "Get lessons by candidate")
    public List<LessonResponse> getByCandidate(@PathVariable Long candidateId,
                                               @RequestParam(required = false) String language) {
        return lessonService.getLessonsByCandidate(candidateId, language);
    }

    @GetMapping("/progress/{candidateId}")
    @Operation(summary = "Get progress percentage for a candidate")
    public double progress(@PathVariable Long candidateId) {
        return lessonService.getProgress(candidateId);
    }

    @GetMapping("/{lessonId}/attempts")
    @Operation(summary = "Get attempts for a candidate on a lesson")
    public List<LessonAttemptResponse> getAttempts(
            @PathVariable Long lessonId,
            @RequestParam Long candidateId
    ) {
        return lessonService.getAttempts(lessonId, candidateId);
    }

    // ================= DOCUMENTS =================

    @PostMapping("/{lessonId}/documents")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Upload a document to a lesson")
    public LessonDocumentResponse uploadDocument(
            @PathVariable Long lessonId,
            @RequestParam MultipartFile file
    ) {
        return lessonService.uploadDocument(lessonId, file);
    }

    @GetMapping("/{lessonId}/documents")
    @Operation(summary = "Get documents for a lesson")
    public List<LessonDocumentResponse> getDocuments(@PathVariable Long lessonId) {
        return lessonService.getDocuments(lessonId);
    }

    @DeleteMapping("/{lessonId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Delete a lesson document")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) {
        lessonService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }

    // ================= GRADEBOOK =================

    @GetMapping("/grades/instructor/{instructorId}")
    @Operation(summary = "Get gradebook by instructor")
    public List<LessonGradeResponse> getGradebookByInstructor(@PathVariable Long instructorId) {
        return lessonService.getGradebookByInstructor(instructorId);
    }

    @GetMapping("/{lessonId}/grades")
    @Operation(summary = "Get gradebook by lesson")
    public List<LessonGradeResponse> getGradebookByLesson(@PathVariable Long lessonId) {
        return lessonService.getGradebookByLesson(lessonId);
    }

    @GetMapping("/grades/candidate/{candidateId}")
    @Operation(summary = "Get gradebook by candidate")
    public List<LessonGradeResponse> getGradebookByCandidate(@PathVariable Long candidateId) {
        return lessonService.getGradebookByCandidate(candidateId);
    }
}
