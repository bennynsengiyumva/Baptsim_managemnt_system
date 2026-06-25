package com.church.baptism.repository.member;

import com.church.baptism.entity.member.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberRepository
        extends JpaRepository<Member, Long> {

    List<Member> findByLocalChurch(String church);

    List<Member> findByStatus(Member.MemberStatus status);

    List<Member> findByDepartmentsId(Long departmentId);
}
