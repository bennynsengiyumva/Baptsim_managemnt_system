package com.church.baptism.dto.response;

public class ChurchResponse {

    private Long id;
    private String churchName;
    private Long districtId;
    private String districtName;
    private Long fieldId;
    private String fieldName;
    private Long unionId;
    private String unionName;
    private String address;
    private String phone;
    private String email;
    private boolean active;
    private PastorResponse pastor;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }
    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }
    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }
    public Long getFieldId() { return fieldId; }
    public void setFieldId(Long fieldId) { this.fieldId = fieldId; }
    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }
    public Long getUnionId() { return unionId; }
    public void setUnionId(Long unionId) { this.unionId = unionId; }
    public String getUnionName() { return unionName; }
    public void setUnionName(String unionName) { this.unionName = unionName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public PastorResponse getPastor() { return pastor; }
    public void setPastor(PastorResponse pastor) { this.pastor = pastor; }
}
