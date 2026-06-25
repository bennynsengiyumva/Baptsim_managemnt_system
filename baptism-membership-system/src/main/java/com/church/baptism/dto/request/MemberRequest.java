package com.church.baptism.dto.request;

import java.time.LocalDate;
import java.util.List;

public class MemberRequest {

    public Long candidateId;
    public LocalDate baptismDate;
    public String localChurch;
    public List<Long> departmentIds;
    public String leadershipRole;
    public String pastoralNotes;
}
