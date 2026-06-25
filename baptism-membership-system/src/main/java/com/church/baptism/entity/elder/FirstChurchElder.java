package com.church.baptism.entity.elder;

import com.church.baptism.entity.church.Church;
import jakarta.persistence.*;

@Entity
@Table(name = "first_church_elders")
public class FirstChurchElder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    private String phone;

    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id", nullable = false)
    private Church church;

    public FirstChurchElder() {}

    public Long getId() { return id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Church getChurch() { return church; }
    public void setChurch(Church church) { this.church = church; }
}
