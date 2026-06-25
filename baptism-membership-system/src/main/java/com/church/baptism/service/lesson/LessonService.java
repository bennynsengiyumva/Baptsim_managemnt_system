package com.church.baptism.service.lesson;

import com.church.baptism.dto.request.LessonRequest;
import com.church.baptism.dto.response.LessonAttemptResponse;
import com.church.baptism.dto.response.LessonDocumentResponse;
import com.church.baptism.dto.response.LessonGradeResponse;
import com.church.baptism.dto.response.LessonResponse;
import com.church.baptism.entity.biblestudy.BibleStudy;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.lesson.Lesson;
import com.church.baptism.entity.lesson.LessonAnswer;
import com.church.baptism.entity.lesson.LessonAttempt;
import com.church.baptism.entity.lesson.LessonDocument;
import com.church.baptism.entity.lesson.LessonQuestion;
import com.church.baptism.entity.notification.Notification.NotificationType;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.biblestudy.BibleStudyRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.lesson.LessonAnswerRepository;
import com.church.baptism.repository.lesson.LessonAttemptRepository;
import com.church.baptism.repository.lesson.LessonDocumentRepository;
import com.church.baptism.repository.lesson.LessonQuestionRepository;
import com.church.baptism.repository.lesson.LessonRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.file.FileStorageService;
import com.church.baptism.service.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final FileStorageService fileStorageService;
    private final LessonQuestionRepository questionRepository;
    private final LessonAnswerRepository answerRepository;
    private final LessonAttemptRepository attemptRepository;
    private final LessonDocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final BibleStudyRepository bibleStudyRepository;

    public LessonService(
            LessonRepository lessonRepository,
            CandidateRepository candidateRepository,
            InstructorRepository instructorRepository,
            FileStorageService fileStorageService,
            LessonQuestionRepository questionRepository,
            LessonAnswerRepository answerRepository,
            LessonAttemptRepository attemptRepository,
            LessonDocumentRepository documentRepository,
            NotificationService notificationService,
            UserRepository userRepository,
            BibleStudyRepository bibleStudyRepository
    ) {
        this.lessonRepository = lessonRepository;
        this.candidateRepository = candidateRepository;
        this.instructorRepository = instructorRepository;
        this.fileStorageService = fileStorageService;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
        this.documentRepository = documentRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.bibleStudyRepository = bibleStudyRepository;
    }

    // ================= CREATE LESSON =================
    @Transactional
    public LessonResponse createLesson(LessonRequest request, MultipartFile file) {
        Candidate candidate = candidateRepository.findById(request.candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        Instructor instructor = instructorRepository.findById(request.instructorId)
                .orElseThrow(() -> new RuntimeException("Instructor not found"));

        // Validate instructor owns this candidate
        if (candidate.getInstructor() == null || !candidate.getInstructor().getId().equals(instructor.getId())) {
            throw new RuntimeException("Instructor does not have this candidate assigned");
        }

        String fileUrl = null;
        if (file != null && !file.isEmpty()) {
            fileUrl = fileStorageService.uploadFile(file);
        }

        Lesson lesson = new Lesson();
        lesson.setLessonTitle(request.lessonTitle);
        lesson.setLessonDate(request.lessonDate);
        lesson.setNotes(request.notes);
        lesson.setDocumentUrl(fileUrl);
        lesson.setRequiredScore(request.requiredScore);
        lesson.setLessonOrder(request.lessonOrder);
        lesson.setMaxAttempts(request.maxAttempts);
        lesson.setObtainedScore(0);
        lesson.setCompleted(false);
        lesson.setCandidate(candidate);
        lesson.setInstructor(instructor);

        if (request.bibleStudyId != null) {
            BibleStudy bibleStudy = bibleStudyRepository.findById(request.bibleStudyId)
                    .orElseThrow(() -> new RuntimeException("Bible study not found"));
            lesson.setBibleStudy(bibleStudy);
        }

        if (request.questions != null && !request.questions.isEmpty()) {
            List<LessonQuestion> questions = new ArrayList<>();
            for (int i = 0; i < request.questions.size(); i++) {
                LessonRequest.QuestionRequest qr = request.questions.get(i);
                LessonQuestion q = new LessonQuestion();
                q.setQuestion(qr.question);
                q.setCorrectAnswer(qr.correctAnswer);
                q.setOptions(qr.options);
                q.setOrderIndex(qr.orderIndex > 0 ? qr.orderIndex : i);
                q.setLesson(lesson);
                questions.add(q);
            }
            lesson.setQuestions(questions);
        }

        lessonRepository.save(lesson);

        // Notify candidate about new lesson
        userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
            notificationService.sendToUser(u.getId(),
                "New Lesson Available",
                "A new lesson \"" + lesson.getLessonTitle() + "\" has been assigned to you.",
                NotificationType.NEW_LESSON)
        );

        return mapToResponse(lesson, true);
    }

    // ================= ADD QUESTIONS TO EXISTING LESSON =================
    @Transactional
    public LessonResponse addQuestions(Long lessonId, List<LessonRequest.QuestionRequest> questions) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        List<LessonQuestion> questionEntities = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            LessonRequest.QuestionRequest qr = questions.get(i);
            LessonQuestion q = new LessonQuestion();
            q.setQuestion(qr.question);
            q.setCorrectAnswer(qr.correctAnswer);
            q.setOptions(qr.options);
            q.setOrderIndex(qr.orderIndex > 0 ? qr.orderIndex : i);
            q.setLesson(lesson);
            questionEntities.add(q);
        }
        lesson.getQuestions().clear();
        lesson.getQuestions().addAll(questionEntities);
        lessonRepository.save(lesson);
        return mapToResponse(lesson, true);
    }

    // ================= START ATTEMPT =================
    public LessonAttemptResponse startAttempt(Long lessonId, Long candidateId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        // Check previous lesson is completed
        if (lesson.getLessonOrder() > 1) {
            List<Lesson> prevLessons = lessonRepository
                    .findByCandidateIdAndCompleted(candidateId, true);
            boolean prevCompleted = prevLessons.stream()
                    .anyMatch(l -> l.getLessonOrder() == lesson.getLessonOrder() - 1);
            if (!prevCompleted) {
                throw new RuntimeException("Complete the previous lesson before starting this one");
            }
        }

        // Check max attempts
        int attemptsUsed = attemptRepository.countByLessonIdAndCandidateId(lessonId, candidateId);
        if (attemptsUsed >= lesson.getMaxAttempts()) {
            throw new RuntimeException("Maximum attempts (" + lesson.getMaxAttempts() + ") reached for this lesson");
        }

        // Check if already passed
        if (lesson.isCompleted()) {
            throw new RuntimeException("Lesson already completed");
        }

        LessonAttempt attempt = new LessonAttempt();
        attempt.setLesson(lesson);
        attempt.setCandidate(candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found")));
        attempt.setAttemptNumber(attemptsUsed + 1);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setPassed(false);
        attemptRepository.save(attempt);

        return mapToAttemptResponse(attempt, lesson);
    }

    // ================= SUBMIT ATTEMPT =================
    @Transactional
    public LessonAttemptResponse submitAttempt(Long lessonId, Long candidateId,
                                                List<Long> questionIds, List<String> answers) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        LessonAttempt attempt = attemptRepository
                .findTopByLessonIdAndCandidateIdOrderByAttemptNumberDesc(lessonId, candidateId)
                .orElseThrow(() -> new RuntimeException("No active attempt found"));

        if (attempt.isPassed() || attempt.getCompletedAt() != null) {
            throw new RuntimeException("This attempt has already been submitted");
        }

        // Grade
        int totalQuestions = questionIds.size();
        int correctCount = 0;

        for (int i = 0; i < totalQuestions; i++) {
            Long qid = questionIds.get(i);
            LessonQuestion q = questionRepository.findById(qid)
                    .orElseThrow(() -> new RuntimeException("Question not found: " + qid));

            String answer = answers.get(i);
            boolean isCorrect = q.getCorrectAnswer().equalsIgnoreCase(answer);
            if (isCorrect) correctCount++;

            LessonAnswer a = new LessonAnswer();
            a.setCandidate(attempt.getCandidate());
            a.setQuestion(q);
            a.setSelectedAnswer(answer);
            a.setCorrect(isCorrect);
            answerRepository.save(a);
        }

        int score = (correctCount * 100) / totalQuestions;
        boolean passed = score >= lesson.getRequiredScore();

        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        if (passed) {
            lesson.setObtainedScore(score);
            lesson.setCompleted(true);
            lessonRepository.save(lesson);

            // Notify candidate about lesson completion
            Candidate candidate = attempt.getCandidate();
            userRepository.findByEmail(candidate.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Lesson Completed",
                    "You passed \"" + lesson.getLessonTitle() + "\" with " + score + "%!",
                    NotificationType.PROGRESS_UPDATE)
            );

            // Notify instructor
            Instructor instructor = lesson.getInstructor();
            userRepository.findByEmail(instructor.getEmail()).ifPresent(u ->
                notificationService.sendToUser(u.getId(),
                    "Lesson Completed by Candidate",
                    candidate.getFullName() + " passed \"" + lesson.getLessonTitle() + "\" with " + score + "%",
                    NotificationType.PROGRESS_UPDATE)
            );
        }

        return mapToAttemptResponse(attempt, lesson);
    }

    // ================= GET LESSONS BY INSTRUCTOR =================
    public List<LessonResponse> getLessonsByInstructor(Long instructorId) {
        return lessonRepository.findByInstructorId(instructorId)
                .stream()
                .map(l -> mapToResponse(l, false))
                .collect(Collectors.toList());
    }

    // ================= GET LESSONS BY BIBLE STUDY =================
    public List<LessonResponse> getLessonsByBibleStudy(Long bibleStudyId) {
        return lessonRepository.findByBibleStudyId(bibleStudyId)
                .stream()
                .map(l -> mapToResponse(l, false))
                .collect(Collectors.toList());
    }

    // ================= GET LESSONS BY CANDIDATE =================
    public List<LessonResponse> getLessonsByCandidate(Long candidateId) {
        return lessonRepository.findByCandidateIdOrderByLessonOrderAsc(candidateId)
                .stream()
                .map(l -> mapToResponse(l, false))
                .collect(Collectors.toList());
    }

    // ================= GET LESSON BY ID =================
    public LessonResponse getLessonById(Long lessonId, boolean includeAnswers) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
        return mapToResponse(lesson, includeAnswers);
    }

    public LessonResponse getLessonById(Long lessonId) {
        return getLessonById(lessonId, false);
    }

    // ================= GET ALL =================
    public List<LessonResponse> getAllLessons() {
        return lessonRepository.findAll()
                .stream()
                .map(l -> mapToResponse(l, false))
                .collect(Collectors.toList());
    }

    // ================= PROGRESS =================
    public double getProgress(Long candidateId) {
        List<Lesson> lessons = lessonRepository.findByCandidateId(candidateId);
        if (lessons.isEmpty()) return 0;
        long completed = lessons.stream().filter(Lesson::isCompleted).count();
        return (completed * 100.0) / lessons.size();
    }

    // ================= UPDATE LESSON =================
    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonRequest request, MultipartFile file) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        lesson.setLessonTitle(request.lessonTitle);
        lesson.setLessonDate(request.lessonDate);
        lesson.setNotes(request.notes);
        lesson.setRequiredScore(request.requiredScore);
        lesson.setLessonOrder(request.lessonOrder);
        lesson.setMaxAttempts(request.maxAttempts);

        if (file != null && !file.isEmpty()) {
            lesson.setDocumentUrl(fileStorageService.uploadFile(file));
        }

        if (request.questions != null && !request.questions.isEmpty()) {
            questionRepository.deleteByLessonId(lessonId);
            List<LessonQuestion> questions = new ArrayList<>();
            for (int i = 0; i < request.questions.size(); i++) {
                LessonRequest.QuestionRequest qr = request.questions.get(i);
                LessonQuestion q = new LessonQuestion();
                q.setQuestion(qr.question);
                q.setCorrectAnswer(qr.correctAnswer);
                q.setOptions(qr.options);
                q.setOrderIndex(qr.orderIndex > 0 ? qr.orderIndex : i);
                q.setLesson(lesson);
                questions.add(q);
            }
            lesson.setQuestions(questions);
        }

        lessonRepository.save(lesson);
        return mapToResponse(lesson, true);
    }

    // ================= DELETE LESSON =================
    @Transactional
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        // Delete answers, attempts, questions first (FK constraint order)
        answerRepository.deleteByLessonId(lessonId);
        attemptRepository.deleteByLessonId(lessonId);
        if (lesson.getQuestions() != null) {
            questionRepository.deleteByLessonId(lessonId);
        }
        lessonRepository.delete(lesson);
    }

    // ================= GET CANDIDATES WHO PASSED LESSON =================
    public List<LessonGradeResponse> getCandidatesByLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        List<LessonAttempt> attempts = attemptRepository
                .findByLessonIdAndCandidateIdOrderByAttemptNumberAsc(lessonId, lesson.getCandidate().getId());

        int bestScore = attempts.stream()
                .mapToInt(LessonAttempt::getScore)
                .max()
                .orElse(0);

        LessonGradeResponse g = new LessonGradeResponse();
        g.lessonId = lesson.getId();
        g.lessonTitle = lesson.getLessonTitle();
        g.candidateId = lesson.getCandidate().getId();
        g.candidateName = lesson.getCandidate().getFullName();
        g.studentScore = lesson.getObtainedScore();
        g.requiredScore = lesson.getRequiredScore();
        g.completed = lesson.isCompleted();
        g.attemptsUsed = attempts.size();
        g.bestScore = bestScore;

        return List.of(g);
    }

    // ================= GET ATTEMPTS FOR CANDIDATE ON LESSON =================
    public List<LessonAttemptResponse> getAttempts(Long lessonId, Long candidateId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        return attemptRepository
                .findByLessonIdAndCandidateIdOrderByAttemptNumberAsc(lessonId, candidateId)
                .stream()
                .map(a -> mapToAttemptResponse(a, lesson))
                .collect(Collectors.toList());
    }

    // ================= DOCUMENT MANAGEMENT =================

    @Transactional
    public LessonDocumentResponse uploadDocument(Long lessonId, MultipartFile file) {
        lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        String fileUrl = fileStorageService.uploadFile(file);

        LessonDocument doc = new LessonDocument();
        doc.setLessonId(lessonId);
        doc.setFileName(file.getOriginalFilename());
        doc.setFileUrl(fileUrl);
        doc.setFileType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setUploadedAt(LocalDateTime.now());
        documentRepository.save(doc);

        return mapToDocumentResponse(doc);
    }

    public List<LessonDocumentResponse> getDocuments(Long lessonId) {
        return documentRepository.findByLessonId(lessonId)
                .stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        documentRepository.deleteById(documentId);
    }

    // ================= GRADEBOOK =================

    public List<LessonGradeResponse> getGradebookByInstructor(Long instructorId) {
        List<Lesson> lessons = lessonRepository.findByInstructorId(instructorId);

        return lessons.stream().map(lesson -> {
            Long candidateId = lesson.getCandidate().getId();
            List<LessonAttempt> attempts = attemptRepository
                    .findByLessonIdAndCandidateIdOrderByAttemptNumberAsc(lesson.getId(), candidateId);

            int bestScore = attempts.stream()
                    .mapToInt(LessonAttempt::getScore)
                    .max()
                    .orElse(0);

            LessonGradeResponse g = new LessonGradeResponse();
            g.lessonId = lesson.getId();
            g.lessonTitle = lesson.getLessonTitle();
            g.candidateId = candidateId;
            g.candidateName = lesson.getCandidate().getFullName();
            g.studentScore = lesson.getObtainedScore();
            g.requiredScore = lesson.getRequiredScore();
            g.completed = lesson.isCompleted();
            g.attemptsUsed = attempts.size();
            g.bestScore = bestScore;
            return g;
        }).collect(Collectors.toList());
    }

    public List<LessonGradeResponse> getGradebookByLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        List<LessonAttempt> attempts = attemptRepository
                .findByLessonIdAndCandidateIdOrderByAttemptNumberAsc(lessonId, lesson.getCandidate().getId());

        int bestScore = attempts.stream()
                .mapToInt(LessonAttempt::getScore)
                .max()
                .orElse(0);

        LessonGradeResponse g = new LessonGradeResponse();
        g.lessonId = lesson.getId();
        g.lessonTitle = lesson.getLessonTitle();
        g.candidateId = lesson.getCandidate().getId();
        g.candidateName = lesson.getCandidate().getFullName();
        g.studentScore = lesson.getObtainedScore();
        g.requiredScore = lesson.getRequiredScore();
        g.completed = lesson.isCompleted();
        g.attemptsUsed = attempts.size();
        g.bestScore = bestScore;

        return List.of(g);
    }

    // ================= MAP TO RESPONSE =================

    private LessonDocumentResponse mapToDocumentResponse(LessonDocument doc) {
        LessonDocumentResponse r = new LessonDocumentResponse();
        r.id = doc.getId();
        r.lessonId = doc.getLessonId();
        r.fileName = doc.getFileName();
        r.fileUrl = doc.getFileUrl();
        r.fileType = doc.getFileType();
        r.fileSize = doc.getFileSize();
        r.uploadedAt = doc.getUploadedAt();
        return r;
    }
    private LessonResponse mapToResponse(Lesson lesson, boolean includeAnswers) {
        LessonResponse r = new LessonResponse();
        r.id = lesson.getId();
        r.lessonTitle = lesson.getLessonTitle();
        r.lessonDate = lesson.getLessonDate();
        r.notes = lesson.getNotes();
        r.documentUrl = lesson.getDocumentUrl();
        r.candidateName = lesson.getCandidate().getFullName();
        r.candidateId = lesson.getCandidate().getId();
        r.instructorName = lesson.getInstructor().getFullName();
        r.instructorId = lesson.getInstructor().getId();
        r.bibleStudyId = lesson.getBibleStudy() != null ? lesson.getBibleStudy().getId() : null;
        r.bibleStudyTitle = lesson.getBibleStudy() != null ? lesson.getBibleStudy().getTitle() : null;
        r.requiredScore = lesson.getRequiredScore();
        r.studentScore = lesson.getObtainedScore();
        r.lessonOrder = lesson.getLessonOrder();
        r.maxAttempts = lesson.getMaxAttempts();
        r.completed = lesson.isCompleted();

        if (lesson.getQuestions() != null) {
            r.questions = lesson.getQuestions().stream()
                    .map(q -> {
                        LessonResponse.QuestionResponse qr = new LessonResponse.QuestionResponse();
                        qr.id = q.getId();
                        qr.question = q.getQuestion();
                        qr.options = q.getOptions();
                        qr.orderIndex = q.getOrderIndex();
                        qr.correctAnswer = includeAnswers ? q.getCorrectAnswer() : null;
                        return qr;
                    })
                    .collect(Collectors.toList());
        }

        return r;
    }

    private LessonAttemptResponse mapToAttemptResponse(LessonAttempt attempt, Lesson lesson) {
        LessonAttemptResponse r = new LessonAttemptResponse();
        r.id = attempt.getId();
        r.lessonId = lesson.getId();
        r.lessonTitle = lesson.getLessonTitle();
        r.candidateId = attempt.getCandidate().getId();
        r.attemptNumber = attempt.getAttemptNumber();
        r.score = attempt.getScore();
        r.passed = attempt.isPassed();
        r.startedAt = attempt.getStartedAt();
        r.completedAt = attempt.getCompletedAt();

        int attemptsUsed = attemptRepository.countByLessonIdAndCandidateId(lesson.getId(), attempt.getCandidate().getId());
        r.attemptsRemaining = Math.max(0, lesson.getMaxAttempts() - attemptsUsed);

        return r;
    }
}
