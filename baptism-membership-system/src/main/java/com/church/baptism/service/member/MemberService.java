package com.church.baptism.service.member;

import com.church.baptism.dto.request.MemberRequest;
import com.church.baptism.dto.response.MemberResponse;
import com.church.baptism.dto.response.MemberResponse.DepartmentInfo;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.candidate.Candidate.CandidateStatus;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.department.Department;
import com.church.baptism.entity.member.Member;
import com.church.baptism.repository.candidate.CandidateRepository;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.department.DepartmentRepository;
import com.church.baptism.repository.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final CandidateRepository candidateRepository;
    private final DepartmentRepository departmentRepository;
    private final ChurchRepository churchRepository;

    public MemberService(
            MemberRepository memberRepository,
            CandidateRepository candidateRepository,
            DepartmentRepository departmentRepository,
            ChurchRepository churchRepository
    ) {
        this.memberRepository = memberRepository;
        this.candidateRepository = candidateRepository;
        this.departmentRepository = departmentRepository;
        this.churchRepository = churchRepository;
    }

    @Transactional
    public MemberResponse create(MemberRequest request) {
        Candidate candidate = candidateRepository.findById(request.candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        candidate.setStatus(CandidateStatus.BAPTIZED);
        candidate.setBaptismDate(request.baptismDate);
        candidateRepository.save(candidate);

        Member member = new Member();
        member.setCandidate(candidate);
        member.setBaptismDate(request.baptismDate);
        member.setLocalChurch(request.localChurch);
        member.setLeadershipRole(request.leadershipRole);
        member.setPastoralNotes(request.pastoralNotes);

        if (request.departmentIds != null) {
            List<Department> departments = departmentRepository.findAllById(request.departmentIds);
            member.setDepartments(new java.util.HashSet<>(departments));
        }

        memberRepository.save(member);
        return map(member);
    }

    public List<MemberResponse> getAll() {
        return memberRepository.findAll()
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    public MemberResponse getById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        return map(member);
    }

    @Transactional
    public MemberResponse assignDepartment(Long memberId, Long departmentId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));
        member.getDepartments().add(dept);
        memberRepository.save(member);
        return map(member);
    }

    @Transactional
    public MemberResponse removeDepartment(Long memberId, Long departmentId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        member.getDepartments().removeIf(d -> d.getId().equals(departmentId));
        memberRepository.save(member);
        return map(member);
    }

    public List<MemberResponse> getByDepartment(Long departmentId) {
        return memberRepository.findByDepartmentsId(departmentId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    public List<MemberResponse> getByChurch(Long churchId) {
        Church church = churchRepository.findById(churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));
        return memberRepository.findByLocalChurch(church.getChurchName())
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    public MemberResponse updateDepartments(Long memberId, List<Long> departmentIds) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        if (departmentIds == null || departmentIds.isEmpty()) {
            member.setDepartments(new java.util.HashSet<>());
        } else {
            List<Department> departments = departmentRepository.findAllById(departmentIds);
            member.setDepartments(new java.util.HashSet<>(departments));
        }
        memberRepository.save(member);
        return map(member);
    }

    private MemberResponse map(Member member) {
        MemberResponse r = new MemberResponse();
        r.id = member.getId();
        r.memberName = member.getCandidate().getFullName();
        r.baptismDate = member.getBaptismDate();
        r.localChurch = member.getLocalChurch();
        r.leadershipRole = member.getLeadershipRole();
        r.status = member.getStatus().name();
        r.candidateId = member.getCandidate().getId();

        if (member.getDepartments() != null) {
            r.departments = member.getDepartments().stream()
                    .map(d -> new DepartmentInfo(d.getId(), d.getName()))
                    .collect(Collectors.toList());
        } else {
            r.departments = Collections.emptyList();
        }

        return r;
    }
}
