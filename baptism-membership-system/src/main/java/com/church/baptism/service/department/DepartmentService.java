package com.church.baptism.service.department;

import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.department.Department;
import com.church.baptism.entity.member.Member;
import com.church.baptism.repository.church.ChurchRepository;
import com.church.baptism.repository.department.DepartmentRepository;
import com.church.baptism.repository.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository repository;
    private final ChurchRepository churchRepository;
    private final MemberRepository memberRepository;

    public DepartmentService(
            DepartmentRepository repository,
            ChurchRepository churchRepository,
            MemberRepository memberRepository
    ) {
        this.repository = repository;
        this.churchRepository = churchRepository;
        this.memberRepository = memberRepository;
    }

    public List<Department> getAll() {
        return repository.findAll();
    }

    public List<Department> getByChurch(Long churchId) {
        return repository.findByChurchId(churchId);
    }

    public Department getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
    }

    @Transactional
    public Department create(Department department, Long churchId, Long headMemberId) {
        Church church = churchRepository.findById(churchId)
                .orElseThrow(() -> new RuntimeException("Church not found"));
        department.setChurch(church);

        if (headMemberId != null) {
            Member head = memberRepository.findById(headMemberId)
                    .orElseThrow(() -> new RuntimeException("Member not found"));
            department.setHead(head);
        }

        return repository.save(department);
    }

    @Transactional
    public Department update(Long id, Department updated, Long headMemberId) {
        Department dept = getById(id);
        dept.setName(updated.getName());
        dept.setDescription(updated.getDescription());

        if (headMemberId != null) {
            Member head = memberRepository.findById(headMemberId)
                    .orElseThrow(() -> new RuntimeException("Member not found"));
            dept.setHead(head);
        }

        return repository.save(dept);
    }

    @Transactional
    public void setHead(Long departmentId, Long memberId) {
        Department dept = getById(departmentId);
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        dept.setHead(member);
        repository.save(dept);
    }

    @Transactional
    public void removeHead(Long departmentId) {
        Department dept = getById(departmentId);
        dept.setHead(null);
        repository.save(dept);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public void toggleActive(Long id) {
        Department dept = getById(id);
        dept.setActive(!dept.isActive());
        repository.save(dept);
    }
}
