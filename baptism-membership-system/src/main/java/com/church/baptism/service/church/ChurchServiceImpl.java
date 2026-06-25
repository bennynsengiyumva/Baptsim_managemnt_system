package com.church.baptism.service.church;

import com.church.baptism.dto.request.ChurchRequest;
import com.church.baptism.dto.response.ChurchDetailResponse;
import com.church.baptism.dto.response.ChurchResponse;
import com.church.baptism.dto.response.PastorResponse;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.church.District;
import com.church.baptism.entity.elder.FirstChurchElder;
import com.church.baptism.entity.instructor.Instructor;
import com.church.baptism.entity.user.Role;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.church.DistrictRepository;
import com.church.baptism.repository.elder.FirstChurchElderRepository;
import com.church.baptism.repository.instructor.InstructorRepository;
import com.church.baptism.repository.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChurchServiceImpl implements ChurchService {

    private final ChurchRepository churchRepository;
    private final DistrictRepository districtRepository;
    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final FirstChurchElderRepository elderRepository;
    private final PasswordEncoder passwordEncoder;

    public ChurchServiceImpl(
            ChurchRepository churchRepository,
            DistrictRepository districtRepository,
            UserRepository userRepository,
            CandidateRepository candidateRepository,
            InstructorRepository instructorRepository,
            FirstChurchElderRepository elderRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.churchRepository = churchRepository;
        this.districtRepository = districtRepository;
        this.userRepository = userRepository;
        this.candidateRepository = candidateRepository;
        this.instructorRepository = instructorRepository;
        this.elderRepository = elderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public ChurchResponse createChurch(ChurchRequest request) {
        District district = districtRepository.findById(request.getDistrictId())
                .orElseThrow(() -> new RuntimeException("District not found"));

        Church church = new Church();
        church.setChurchName(request.getChurchName());
        church.setDistrict(district);
        church.setAddress(request.getAddress());
        church.setPhone(request.getPhone());
        church.setEmail(request.getEmail());
        church.setActive(true);
        church = churchRepository.save(church);

        // Create FIRST_CHURCH_ELDER account if requested
        if (request.isCreateElderAccount() && request.getElderEmail() != null && request.getElderPassword() != null) {
            User elder = new User();
            elder.setFullName(request.getElderFullName() != null ? request.getElderFullName() : request.getChurchName() + " Elder");
            elder.setEmail(request.getElderEmail());
            elder.setPhone(request.getElderPhone());
            elder.setPassword(passwordEncoder.encode(request.getElderPassword()));
            elder.setRole(Role.FIRST_CHURCH_ELDER);
            elder.setUnion(district.getField().getUnion());
            elder.setField(district.getField());
            elder.setDistrict(district);
            elder.setChurch(church);
            userRepository.save(elder);
        }

        return mapToResponse(church);
    }

    @Override
    public List<ChurchResponse> getAllChurches() {
        return churchRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ChurchResponse getChurchById(Long id) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Church not found"));
        return mapToResponse(church);
    }

    @Override
    public ChurchResponse updateChurch(Long id, ChurchRequest request) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Church not found"));

        church.setChurchName(request.getChurchName());
        if (request.getDistrictId() != null) {
            District district = districtRepository.findById(request.getDistrictId())
                    .orElseThrow(() -> new RuntimeException("District not found"));
            church.setDistrict(district);
        }
        church.setAddress(request.getAddress());
        church.setPhone(request.getPhone());
        church.setEmail(request.getEmail());

        return mapToResponse(churchRepository.save(church));
    }

    @Override
    @Transactional
    public ChurchResponse assignPastorToChurch(Long churchId, Long pastorId) {
        Church church = churchRepository.findById(churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));

        User pastor = userRepository.findById(pastorId)
                .orElseThrow(() -> new RuntimeException("Pastor not found"));

        if (pastor.getRole() != Role.PASTOR) {
            throw new RuntimeException("Selected user is not a pastor");
        }

        if (church.getPastor() != null) {
            church.getPastor().getChurches().remove(church);
        }

        church.setPastor(pastor);
        pastor.getChurches().add(church);

        return mapToResponse(churchRepository.save(church));
    }

    @Override
    @Transactional
    public ChurchResponse unassignPastor(Long churchId) {
        Church church = churchRepository.findById(churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));

        if (church.getPastor() != null) {
            church.getPastor().getChurches().remove(church);
            church.setPastor(null);
        }

        return mapToResponse(churchRepository.save(church));
    }

    @Override
    @Transactional
    public void deleteChurch(Long id) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Church not found"));

        if (church.getPastor() != null) {
            church.getPastor().getChurches().remove(church);
        }

        churchRepository.delete(church);
    }

    // ====================== HIERARCHY ======================

    @Override
    public List<ChurchResponse> getChurchesByDistrict(Long districtId) {
        return churchRepository.findByDistrictId(districtId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ChurchDetailResponse getChurchDetail(Long churchId, LocalDate dateFrom, LocalDate dateTo) {
        Church church = churchRepository.findById(churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));

        ChurchDetailResponse detail = new ChurchDetailResponse();
        detail.setChurch(mapToResponse(church));

        List<FirstChurchElder> elders = elderRepository.findByChurchId(churchId);
        detail.setElders(elders.stream().map(e -> {
            ChurchDetailResponse.ElderInfo ei = new ChurchDetailResponse.ElderInfo();
            ei.setId(e.getId());
            ei.setFullName(e.getFullName());
            ei.setEmail(e.getEmail());
            ei.setPhone(e.getPhone());
            return ei;
        }).collect(Collectors.toList()));

        List<Instructor> instructors = instructorRepository.findByChurchId(churchId);
        if (!instructors.isEmpty()) {
            Instructor inst = instructors.get(0);
            ChurchDetailResponse.InstructorInfo ii = new ChurchDetailResponse.InstructorInfo();
            ii.setId(inst.getId());
            ii.setFullName(inst.getFullName());
            ii.setEmail(inst.getEmail());
            ii.setPhone(inst.getPhone());
            detail.setInstructor(ii);
        }

        List<Candidate> candidates = candidateRepository.findByChurchId(churchId);

        // Determine cutoff for "future" — treat candidates created after today as future-dated
        LocalDate today = LocalDate.now();

        // Apply date range filter if provided
        if (dateFrom != null || dateTo != null) {
            candidates = candidates.stream()
                    .filter(c -> {
                        LocalDate refDate = c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate() :
                                (c.getBaptismDate() != null ? c.getBaptismDate() : null);
                        if (refDate == null) return dateFrom == null && dateTo == null;
                        boolean afterFrom = dateFrom == null || !refDate.isBefore(dateFrom);
                        boolean beforeTo = dateTo == null || !refDate.isAfter(dateTo);
                        return afterFrom && beforeTo;
                    })
                    .collect(Collectors.toList());
        }

        detail.setCandidates(candidates.stream().map(c -> {
            ChurchDetailResponse.CandidateInfo ci = new ChurchDetailResponse.CandidateInfo();
            ci.setId(c.getId());
            ci.setFullName(c.getFullName());
            ci.setEmail(c.getEmail());
            ci.setStatus(c.getStatus() != null ? c.getStatus().name() : "REGISTERED");
            ci.setBaptismDate(c.getBaptismDate());
            ci.setCreatedAt(c.getCreatedAt());
            return ci;
        }).collect(Collectors.toList()));

        // Future-dated: candidates where createdAt or baptismDate is after today
        long futureDated = candidates.stream()
                .filter(c -> {
                    if (c.getCreatedAt() != null && c.getCreatedAt().toLocalDate().isAfter(today)) return true;
                    return c.getBaptismDate() != null && c.getBaptismDate().isAfter(today);
                })
                .count();

        ChurchDetailResponse.ProgressInfo progress = new ChurchDetailResponse.ProgressInfo();
        progress.setTotalCandidates(candidates.size());
        progress.setRegistered(candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.REGISTERED).count());
        progress.setInProgress(candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.IN_PROGRESS).count());
        progress.setReadyForBaptism(candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.READY_FOR_BAPTISM).count());
        progress.setBaptized(candidates.stream().filter(c -> c.getStatus() == Candidate.CandidateStatus.BAPTIZED).count());
        progress.setFutureDated(futureDated);
        detail.setProgress(progress);

        return detail;
    }

    private ChurchResponse mapToResponse(Church church) {
        PastorResponse pastor = null;
        if (church.getPastor() != null) {
            User p = church.getPastor();
            pastor = PastorResponse.builder()
                    .id(p.getId())
                    .fullName(p.getFullName())
                    .email(p.getEmail())
                    .phone(p.getPhone())
                    .build();
        }

        ChurchResponse r = new ChurchResponse();
        r.setId(church.getId());
        r.setChurchName(church.getChurchName());
        r.setAddress(church.getAddress());
        r.setPhone(church.getPhone());
        r.setEmail(church.getEmail());
        r.setActive(church.isActive());
        r.setPastor(pastor);

        if (church.getDistrict() != null) {
            r.setDistrictId(church.getDistrict().getId());
            r.setDistrictName(church.getDistrict().getName());
            if (church.getDistrict().getField() != null) {
                r.setFieldId(church.getDistrict().getField().getId());
                r.setFieldName(church.getDistrict().getField().getName());
                if (church.getDistrict().getField().getUnion() != null) {
                    r.setUnionId(church.getDistrict().getField().getUnion().getId());
                    r.setUnionName(church.getDistrict().getField().getUnion().getName());
                }
            }
        }

        return r;
    }
}
