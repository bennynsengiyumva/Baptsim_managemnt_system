package com.church.baptism.entity.baptism;

import com.church.baptism.entity.base.AuditableEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "baptism_events")
public class BaptismEvent extends AuditableEntity {

    @Column(nullable = false)
    private String eventName;

    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalTime eventTime;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String officiatingPastor;

    private String description;

    @Enumerated(EnumType.STRING)
    private BaptismEventStatus status = BaptismEventStatus.PLANNED;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Baptism> registrations = new ArrayList<>();

    public enum BaptismEventStatus {
        PLANNED, CONFIRMED, COMPLETED, CANCELLED
    }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

    public LocalTime getEventTime() { return eventTime; }
    public void setEventTime(LocalTime eventTime) { this.eventTime = eventTime; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getOfficiatingPastor() { return officiatingPastor; }
    public void setOfficiatingPastor(String officiatingPastor) { this.officiatingPastor = officiatingPastor; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BaptismEventStatus getStatus() { return status; }
    public void setStatus(BaptismEventStatus status) { this.status = status; }

    public List<Baptism> getRegistrations() { return registrations; }
    public void setRegistrations(List<Baptism> registrations) { this.registrations = registrations; }
}
