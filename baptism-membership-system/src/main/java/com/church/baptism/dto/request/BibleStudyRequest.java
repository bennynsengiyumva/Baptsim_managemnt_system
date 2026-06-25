package com.church.baptism.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class BibleStudyRequest {
    private String title;
    private String description;
    private Long instructorId;
    private String chapter;
    private String verse;
    private String content;
    private LocalDateTime schedule;
    private Integer duration;
    private String status;
    private List<Long> participantIds;
}
