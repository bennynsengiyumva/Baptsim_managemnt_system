package com.church.baptism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class PastorResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
}