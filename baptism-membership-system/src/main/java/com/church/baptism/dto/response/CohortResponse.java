package com.church.baptism.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CohortResponse {
    private Long id;
    private String cohortName;
    private String cohortCode;
    private String description;
    private String language;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer capacity;
    private String status;
    private Long churchId;
    private String churchName;
    private Long instructorId;
    private String instructorName;
    private int memberCount;
    private int approvedCount;
    private List<CohortMemberResponse> members;
}
