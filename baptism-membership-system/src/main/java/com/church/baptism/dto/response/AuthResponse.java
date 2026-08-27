package com.church.baptism.dto.response;

import com.church.baptism.entity.user.User;

public class AuthResponse {

    public String token;
    public String role;
    public String email;
    public Long id;
    public String fullName;
    public String phone;
    public boolean requiresTwoFactor;
    public String avatar;
    public Long unionId;
    public String unionName;
    public Long fieldId;
    public String fieldName;
    public Long districtId;
    public String districtName;
    public Long churchId;
    public String churchName;
    public String profilePictureUrl;
    public String preferredLanguage;
    public String roleChangeMessage;

    public AuthResponse(String token, String role, String email, Long id, String fullName) {
        this.token = token;
        this.role = role;
        this.email = email;
        this.id = id;
        this.fullName = fullName;
    }

    public AuthResponse(String email, boolean requiresTwoFactor) {
        this.email = email;
        this.requiresTwoFactor = requiresTwoFactor;
    }

    public AuthResponse(String token, User user) {
        this.token = token;
        this.role = user.getRole().name();
        this.email = user.getEmail();
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.phone = user.getPhone();
        this.avatar = user.getAvatar();
        this.unionId = user.getUnion() != null ? user.getUnion().getId() : null;
        this.unionName = user.getUnion() != null ? user.getUnion().getName() : null;
        this.fieldId = user.getField() != null ? user.getField().getId() : null;
        this.fieldName = user.getField() != null ? user.getField().getName() : null;
        this.districtId = user.getDistrict() != null ? user.getDistrict().getId() : null;
        this.districtName = user.getDistrict() != null ? user.getDistrict().getName() : null;
        this.churchId = user.getChurch() != null ? user.getChurch().getId() : null;
        this.churchName = user.getChurch() != null ? user.getChurch().getChurchName() : null;
        this.preferredLanguage = user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en";
        this.roleChangeMessage = user.getRoleChangeMessage();
    }
}
