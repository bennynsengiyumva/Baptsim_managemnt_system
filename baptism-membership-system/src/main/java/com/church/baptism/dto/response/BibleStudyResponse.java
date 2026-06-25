package com.church.baptism.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class BibleStudyResponse {
    private Long id;
    private String title;
    private String description;
    private Long instructorId;
    private String instructorName;
    private String chapter;
    private String verse;
    private String content;
    private LocalDateTime schedule;
    private Integer duration;
    private String status;
    private List<Long> participantIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
