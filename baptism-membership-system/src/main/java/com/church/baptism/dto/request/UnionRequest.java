package com.church.baptism.dto.request;

public class UnionRequest {
    public String name;
    public String code;
    public String address;
    public String phone;
    public String email;

    // Optional head account creation
    public boolean createHeadAccount;
    public String headFullName;
    public String headEmail;
    public String headPhone;
    public String headPassword;
}
