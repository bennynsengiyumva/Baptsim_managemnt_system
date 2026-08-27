package com.church.baptism.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String avatar;
    private String preferredLanguage;
    private String gender;
    private String dateOfBirth;
    private String address;
    private String emergencyContact;
}
