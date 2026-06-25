package com.church.baptism.entity.baptism;

import com.church.baptism.entity.base.AuditableEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "baptism_events")
public class BaptismEvent extends AuditableEntity {

    @Column(nullable = false)
    private LocalDate eventDate;

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



    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }

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
