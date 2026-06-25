package com.church.baptism.entity.department;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.member.Member;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "departments")
public class Department extends AuditableEntity {

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "church_id")
    private Church church;

    @ManyToOne
    @JoinColumn(name = "head_member_id")
    private Member head;

    private boolean active = true;

    @ManyToMany(mappedBy = "departments")
    private Set<Member> members = new HashSet<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Church getChurch() { return church; }
    public void setChurch(Church church) { this.church = church; }

    public Member getHead() { return head; }
    public void setHead(Member head) { this.head = head; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Set<Member> getMembers() { return members; }
    public void setMembers(Set<Member> members) { this.members = members; }
}
