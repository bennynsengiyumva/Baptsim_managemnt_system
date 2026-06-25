package com.church.baptism.dto.request;

import java.time.LocalDate;

public class BaptismRequest {

    public LocalDate baptismDate;

    public String location;

    public String officiatingPastor;

    public String witnessName;

    public String sponsorName;

    public Long candidateId;
}