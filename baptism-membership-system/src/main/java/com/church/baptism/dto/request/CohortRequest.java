package com.church.baptism.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CohortRequest {
    private String cohortName;
    private String cohortCode;
    private String description;
    private String language;
    private String startDate;
    private String endDate;
    private Integer capacity;
    private String status;
    private Long churchId;
    private Long instructorId;
}
