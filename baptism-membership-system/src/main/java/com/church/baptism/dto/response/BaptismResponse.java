package com.church.baptism.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class BaptismResponse {
    public Long id;
    public Long candidateId;
    public String candidateName;
    public String candidateEmail;
    public Long eventId;
    public LocalDate baptismDate;
    public String location;
    public String officiatingPastor;
    public String witnessName;
    public String sponsorName;
    public boolean baptized;
    public boolean approved;
    public boolean certificateSigned;
    public LocalDateTime signedAt;
    public String certificateNumber;
    public int baptismOrder;
    public List<String> photoUrls;
    public LocalDateTime confirmedAt;
}
