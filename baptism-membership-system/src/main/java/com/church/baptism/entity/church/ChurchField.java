package com.church.baptism.entity.church;

import com.church.baptism.entity.base.AuditableEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "church_fields")
public class ChurchField extends AuditableEntity {

    @Column(nullable = false)
    private String name;

    private String code;

    private String address;

    private String phone;

    private String email;

    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "union_id", nullable = false)
    private Union union;

    public ChurchField() {}

    public ChurchField(String name, Union union) {
        this.name = name;
        this.union = union;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Union getUnion() { return union; }
    public void setUnion(Union union) { this.union = union; }
}
