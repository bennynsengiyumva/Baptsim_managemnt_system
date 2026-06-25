package com.church.baptism.dto.response;

import java.time.LocalDateTime;

public class LessonDocumentResponse {
    public Long id;
    public Long lessonId;
    public String fileName;
    public String fileUrl;
    public String fileType;
    public long fileSize;
    public LocalDateTime uploadedAt;
}
