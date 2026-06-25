package com.church.baptism.entity.church;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "churches")
public class Church extends AuditableEntity {

    @Column(nullable = false)
    private String churchName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private District district;

    private String address;

    private String phone;

    private String email;

    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pastor_id")
    private User pastor;

    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }

    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public User getPastor() { return pastor; }
    public void setPastor(User pastor) { this.pastor = pastor; }
}
