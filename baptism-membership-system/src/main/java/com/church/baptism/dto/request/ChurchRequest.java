package com.church.baptism.dto.request;

public class ChurchRequest {

    private String churchName;
    private Long districtId;
    private String address;
    private String phone;
    private String email;

    // Optional elder account creation
    private boolean createElderAccount;
    private String elderFullName;
    private String elderEmail;
    private String elderPhone;
    private String elderPassword;

    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }
    public Long getDistrictId() { return districtId; }
    public void setDistrictId(Long districtId) { this.districtId = districtId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isCreateElderAccount() { return createElderAccount; }
    public void setCreateElderAccount(boolean createElderAccount) { this.createElderAccount = createElderAccount; }
    public String getElderFullName() { return elderFullName; }
    public void setElderFullName(String elderFullName) { this.elderFullName = elderFullName; }
    public String getElderEmail() { return elderEmail; }
    public void setElderEmail(String elderEmail) { this.elderEmail = elderEmail; }
    public String getElderPhone() { return elderPhone; }
    public void setElderPhone(String elderPhone) { this.elderPhone = elderPhone; }
    public String getElderPassword() { return elderPassword; }
    public void setElderPassword(String elderPassword) { this.elderPassword = elderPassword; }
}
