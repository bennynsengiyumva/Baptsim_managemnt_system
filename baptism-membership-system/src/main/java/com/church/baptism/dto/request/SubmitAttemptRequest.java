package com.church.baptism.dto.request;

import java.util.List;

public class SubmitAttemptRequest {
    public Long candidateId;
    public List<Long> questionIds;
    public List<String> answers;
}
