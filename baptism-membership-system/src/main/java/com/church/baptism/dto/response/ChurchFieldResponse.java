package com.church.baptism.dto.response;

public class ChurchFieldResponse {
    private Long id;
    private String name;
    private String code;
    private String address;
    private String phone;
    private String email;
    private boolean active;
    private Long unionId;
    private String unionName;
    private Long headUserId;
    private String headUserName;
    private String headUserEmail;
    private String headUserPhone;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public Long getUnionId() { return unionId; }
    public void setUnionId(Long unionId) { this.unionId = unionId; }
    public String getUnionName() { return unionName; }
    public void setUnionName(String unionName) { this.unionName = unionName; }
    public Long getHeadUserId() { return headUserId; }
    public void setHeadUserId(Long headUserId) { this.headUserId = headUserId; }
    public String getHeadUserName() { return headUserName; }
    public void setHeadUserName(String headUserName) { this.headUserName = headUserName; }
    public String getHeadUserEmail() { return headUserEmail; }
    public void setHeadUserEmail(String headUserEmail) { this.headUserEmail = headUserEmail; }
    public String getHeadUserPhone() { return headUserPhone; }
    public void setHeadUserPhone(String headUserPhone) { this.headUserPhone = headUserPhone; }
}
