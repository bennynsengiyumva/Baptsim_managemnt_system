package com.church.baptism.entity.user;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.church.ChurchField;
import com.church.baptism.entity.church.District;
import com.church.baptism.entity.church.Union;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User extends AuditableEntity {
    @ManyToOne
    @JoinColumn(name = "church_id")
    private Church church;

    @ManyToOne
    @JoinColumn(name = "union_id")
    private Union union;

    @ManyToOne
    @JoinColumn(name = "field_id")
    private ChurchField field;

    @ManyToOne
    @JoinColumn(name = "district_id")
    private District district;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;          // ← top-level Role, no inner enum

    private boolean enabled = true;

    private boolean emailVerified = false;

    private boolean twoFactorEnabled = false;
    private String twoFactorCode;
    private LocalDateTime twoFactorCodeExpiry;

    @Lob
    @Column(columnDefinition = "MEDIUMTEXT")
    private String avatar;

    @OneToMany(mappedBy = "pastor")
    private List<Church> churches;
}