package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.util.List;

public class BaptismEventResponse {
    public Long id;
    public LocalDate eventDate;
    public String location;
    public String officiatingPastor;
    public String description;
    public String status;
    public int registeredCount;
    public int baptizedCount;
    public List<BaptismResponse> registrations;
}
