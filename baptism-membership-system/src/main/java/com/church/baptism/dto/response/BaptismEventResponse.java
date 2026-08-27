package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class BaptismEventResponse {
    public Long id;
    public String eventName;
    public LocalDate eventDate;
    public LocalTime eventTime;
    public String location;
    public String officiatingPastor;
    public String description;
    public String status;
    public int registeredCount;
    public int approvedCount;
    public int pendingCount;
    public int rejectedCount;
    public int baptizedCount;
    public List<BaptismResponse> registrations;
    public LocalDateTime createdAt;
}
