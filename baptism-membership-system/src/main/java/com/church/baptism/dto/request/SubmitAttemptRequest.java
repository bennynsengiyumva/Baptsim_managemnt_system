package com.church.baptism.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class SubmitAttemptRequest {
    @NotNull(message = "Candidate ID is required")
    public Long candidateId;

    @NotEmpty(message = "Question IDs are required")
    public List<Long> questionIds;

    @NotEmpty(message = "Answers are required")
    public List<String> answers;
}
