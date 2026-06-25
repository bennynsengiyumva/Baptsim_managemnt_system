package com.church.baptism.dto.request;

public class ChurchFieldRequest {
    public String name;
    public String code;
    public String address;
    public String phone;
    public String email;
    public Long unionId;

    // Optional head account creation
    public boolean createHeadAccount;
    public String headFullName;
    public String headEmail;
    public String headPhone;
    public String headPassword;
}
