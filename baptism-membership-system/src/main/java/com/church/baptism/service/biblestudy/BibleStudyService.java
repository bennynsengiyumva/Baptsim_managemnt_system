package com.church.baptism.service.biblestudy;

import com.church.baptism.dto.request.BibleStudyRequest;
import com.church.baptism.dto.response.BibleStudyResponse;
import com.church.baptism.entity.biblestudy.BibleStudy;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.repository.biblestudy.BibleStudyRepository;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BibleStudyService {

    private final BibleStudyRepository repository;
    private final InstructorRepository instructorRepository;
    private final CandidateRepository candidateRepository;

    public BibleStudyService(BibleStudyRepository repository,
                             InstructorRepository instructorRepository,
                             CandidateRepository candidateRepository) {
        this.repository = repository;
        this.instructorRepository = instructorRepository;
        this.candidateRepository = candidateRepository;
    }

    public List<BibleStudyResponse> getAll() {
        return repository.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    public BibleStudyResponse getById(Long id) {
        BibleStudy bs = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bible study not found"));
        return map(bs);
    }

    @Transactional
    public BibleStudyResponse create(BibleStudyRequest request) {
        BibleStudy bs = new BibleStudy();
        bs.setTitle(request.getTitle());
        bs.setDescription(request.getDescription());
        bs.setChapter(request.getChapter());
        bs.setVerse(request.getVerse());
        bs.setContent(request.getContent());
        bs.setSchedule(request.getSchedule());
        bs.setDuration(request.getDuration());

        if (request.getStatus() != null) {
            bs.setStatus(BibleStudy.BibleStudyStatus.valueOf(request.getStatus()));
        }

        if (request.getInstructorId() != null) {
            Instructor instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
            bs.setInstructor(instructor);
        }

        if (request.getParticipantIds() != null) {
            List<Candidate> participants = candidateRepository.findAllById(request.getParticipantIds());
            bs.getParticipants().addAll(participants);
        }

        return map(repository.save(bs));
    }

    @Transactional
    public BibleStudyResponse update(Long id, BibleStudyRequest request) {
        BibleStudy bs = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bible study not found"));

        if (request.getTitle() != null) bs.setTitle(request.getTitle());
        if (request.getDescription() != null) bs.setDescription(request.getDescription());
        if (request.getChapter() != null) bs.setChapter(request.getChapter());
        if (request.getVerse() != null) bs.setVerse(request.getVerse());
        if (request.getContent() != null) bs.setContent(request.getContent());
        if (request.getSchedule() != null) bs.setSchedule(request.getSchedule());
        if (request.getDuration() != null) bs.setDuration(request.getDuration());
        if (request.getStatus() != null) {
            bs.setStatus(BibleStudy.BibleStudyStatus.valueOf(request.getStatus()));
        }

        if (request.getInstructorId() != null) {
            Instructor instructor = instructorRepository.findById(request.getInstructorId())
                    .orElseThrow(() -> new RuntimeException("Instructor not found"));
            bs.setInstructor(instructor);
        }

        return map(repository.save(bs));
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public BibleStudyResponse addParticipant(Long id, Long candidateId) {
        BibleStudy bs = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bible study not found"));
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        bs.getParticipants().add(candidate);
        return map(repository.save(bs));
    }

    @Transactional
    public BibleStudyResponse removeParticipant(Long id, Long candidateId) {
        BibleStudy bs = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bible study not found"));
        bs.getParticipants().removeIf(p -> p.getId().equals(candidateId));
        return map(repository.save(bs));
    }

    private BibleStudyResponse map(BibleStudy bs) {
        return BibleStudyResponse.builder()
                .id(bs.getId())
                .title(bs.getTitle())
                .description(bs.getDescription())
                .instructorId(bs.getInstructor() != null ? bs.getInstructor().getId() : null)
                .instructorName(bs.getInstructor() != null ? bs.getInstructor().getFullName() : null)
                .chapter(bs.getChapter())
                .verse(bs.getVerse())
                .content(bs.getContent())
                .schedule(bs.getSchedule())
                .duration(bs.getDuration())
                .status(bs.getStatus().name())
                .participantIds(bs.getParticipants().stream().map(Candidate::getId).collect(Collectors.toList()))
                .createdAt(bs.getCreatedAt())
                .updatedAt(bs.getUpdatedAt())
                .build();
    }
}
