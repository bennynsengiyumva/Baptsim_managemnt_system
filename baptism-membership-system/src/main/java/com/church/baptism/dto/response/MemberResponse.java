package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.util.List;

public class MemberResponse {

    public Long id;
    public String memberName;
    public LocalDate baptismDate;
    public String localChurch;
    public List<DepartmentInfo> departments;
    public String leadershipRole;
    public String status;
    public Long candidateId;

    public static class DepartmentInfo {
        public Long id;
        public String name;

        public DepartmentInfo(Long id, String name) {
            this.id = id;
            this.name = name;
        }
    }
}
