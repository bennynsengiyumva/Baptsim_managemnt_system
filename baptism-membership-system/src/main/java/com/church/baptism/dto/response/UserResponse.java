package com.church.baptism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private Boolean enabled;
    private String avatar;
    private String unionName;
    private String fieldName;
    private String districtName;
    private String churchName;
    private Long unionId;
    private Long fieldId;
    private Long districtId;
    private Long churchId;
    private boolean twoFactorEnabled;
    private String createdAt;
    private String preferredLanguage;
    private String gender;
    private String dateOfBirth;
    private String address;
    private String emergencyContact;
    private String signaturePath;
}
