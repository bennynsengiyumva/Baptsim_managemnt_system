package com.church.baptism.entity.baptism;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "baptism_request_logs")
public class BaptismRequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long requestId;

    private Long candidateId;

    private Long eventId;

    @Column(nullable = false)
    private String action;

    private String performedBy;

    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public enum Action {
        REQUEST_CREATED,
        REQUEST_APPROVED,
        REQUEST_REJECTED,
        EMAIL_SENT
    }

    public BaptismRequestLog() {
        this.timestamp = LocalDateTime.now();
    }

    public BaptismRequestLog(Long requestId, Long candidateId, Long eventId, String action, String performedBy, String details) {
        this();
        this.requestId = requestId;
        this.candidateId = candidateId;
        this.eventId = eventId;
        this.action = action;
        this.performedBy = performedBy;
        this.details = details;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
