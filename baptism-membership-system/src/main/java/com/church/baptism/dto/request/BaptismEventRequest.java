package com.church.baptism.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;

public class BaptismEventRequest {
    public String eventName;
    public LocalDate eventDate;
    public LocalTime eventTime;
    public String location;
    public String officiatingPastor;
    public String description;
}
