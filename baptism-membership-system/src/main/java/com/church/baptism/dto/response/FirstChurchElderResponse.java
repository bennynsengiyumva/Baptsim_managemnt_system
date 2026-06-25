package com.church.baptism.dto.response;

public class FirstChurchElderResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private boolean active;
    private Long churchId;
    private String churchName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Long getChurchId() { return churchId; }
    public void setChurchId(Long churchId) { this.churchId = churchId; }
    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }
}
