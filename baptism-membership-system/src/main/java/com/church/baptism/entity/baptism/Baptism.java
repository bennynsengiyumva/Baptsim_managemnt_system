package com.church.baptism.entity.baptism;

import com.church.baptism.entity.base.AuditableEntity;
import com.church.baptism.entity.candidate.Candidate;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "baptisms")
public class Baptism extends AuditableEntity {

    @Column(nullable = false)
    private LocalDate baptismDate;

    private String location;

    private String officiatingPastor;

    private String witnessName;

    private String sponsorName;

    private boolean baptized;

    private boolean approved;

    private boolean certificateSigned;

    private LocalDateTime signedAt;

    private String certificateNumber;

    private int baptismOrder;

    @ElementCollection
    private List<String> photoUrls;

    private LocalDateTime confirmedAt;

    @ManyToOne
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private BaptismEvent event;

    public LocalDate getBaptismDate() { return baptismDate; }
    public void setBaptismDate(LocalDate baptismDate) { this.baptismDate = baptismDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getOfficiatingPastor() { return officiatingPastor; }
    public void setOfficiatingPastor(String officiatingPastor) { this.officiatingPastor = officiatingPastor; }

    public String getWitnessName() { return witnessName; }
    public void setWitnessName(String witnessName) { this.witnessName = witnessName; }

    public String getSponsorName() { return sponsorName; }
    public void setSponsorName(String sponsorName) { this.sponsorName = sponsorName; }

    public boolean isBaptized() { return baptized; }
    public void setBaptized(boolean baptized) { this.baptized = baptized; }

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }

    public boolean isCertificateSigned() { return certificateSigned; }
    public void setCertificateSigned(boolean certificateSigned) { this.certificateSigned = certificateSigned; }

    public LocalDateTime getSignedAt() { return signedAt; }
    public void setSignedAt(LocalDateTime signedAt) { this.signedAt = signedAt; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public int getBaptismOrder() { return baptismOrder; }
    public void setBaptismOrder(int baptismOrder) { this.baptismOrder = baptismOrder; }

    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }

    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public Candidate getCandidate() { return candidate; }
    public void setCandidate(Candidate candidate) { this.candidate = candidate; }

    public BaptismEvent getEvent() { return event; }
    public void setEvent(BaptismEvent event) { this.event = event; }
}
