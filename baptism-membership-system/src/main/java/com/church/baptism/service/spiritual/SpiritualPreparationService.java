package com.church.baptism.service.spiritual;

import com.church.baptism.dto.request.SpiritualPreparationRequest;
import com.church.baptism.dto.response.SpiritualPreparationResponse;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.spiritual.SpiritualPreparation;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.spiritual.SpiritualPreparationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpiritualPreparationService {

    private final SpiritualPreparationRepository repository;
    private final CandidateRepository candidateRepository;

    public SpiritualPreparationService(
            SpiritualPreparationRepository repository,
            CandidateRepository candidateRepository
    ) {
        this.repository = repository;
        this.candidateRepository = candidateRepository;
    }

    // CREATE SPIRITUAL RECORD
    public SpiritualPreparationResponse create(
            SpiritualPreparationRequest request
    ) {

        Candidate candidate = candidateRepository.findById(request.candidateId)
                .orElseThrow(() ->
                        new RuntimeException("Candidate not found"));

        SpiritualPreparation sp = new SpiritualPreparation();

        sp.setCandidate(candidate);

        sp.setWorshipAttendance(request.worshipAttendance);
        sp.setPrayerMeetings(request.prayerMeetings);
        sp.setBibleReadingScore(request.bibleReadingScore);
        sp.setCharacterAssessment(request.characterAssessment);

        sp.setPrayerRequest(request.prayerRequest);
        sp.setTestimony(request.testimony);
        sp.setMentorNotes(request.mentorNotes);

        // AUTO CALCULATE READINESS
        sp.calculateReadiness();

        repository.save(sp);

        return map(sp);
    }

    // GET BY CANDIDATE
    public List<SpiritualPreparationResponse> getByCandidate(
            Long candidateId
    ) {

        return repository.findByCandidateId(candidateId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    // DELETE
    public void delete(Long id) {
        SpiritualPreparation sp = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Record not found"));
        repository.delete(sp);
    }

    // ADMIN OVERRIDE
    public void updateReadiness(Long id, boolean status) {

        SpiritualPreparation sp = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Record not found"));

        sp.setReadyForBaptism(status);

        repository.save(sp);
    }

    // MAPPER
    private SpiritualPreparationResponse map(
            SpiritualPreparation sp
    ) {

        SpiritualPreparationResponse r =
                new SpiritualPreparationResponse();

        r.id = sp.getId();

        r.candidateName =
                sp.getCandidate().getFullName();

        r.worshipAttendance =
                sp.getWorshipAttendance();

        r.prayerMeetings =
                sp.getPrayerMeetings();

        r.readinessScore =
                sp.getReadinessScore();

        r.readyForBaptism =
                sp.isReadyForBaptism();

        return r;
    }
}