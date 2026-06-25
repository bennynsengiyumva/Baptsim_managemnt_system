package com.church.baptism.dto.request;

public class DistrictRequest {
    public String name;
    public String code;
    public String address;
    public String phone;
    public String email;
    public Long fieldId;

    // Optional head account creation
    public boolean createHeadAccount;
    public String headFullName;
    public String headEmail;
    public String headPhone;
    public String headPassword;
}
