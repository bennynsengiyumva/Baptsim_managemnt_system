package com.church.baptism.entity.audit;

import com.church.baptism.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "certificate_download_logs")
@Getter
@Setter
public class CertificateDownloadLog extends BaseEntity {

    @Column(name = "certificate_number")
    private String certificateNumber;

    @Column(name = "baptism_id")
    private Long baptismId;

    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "candidate_id")
    private Long candidateId;

    @Column(name = "downloaded_by")
    private String downloadedBy;

    @Column(name = "downloaded_by_name")
    private String downloadedByName;

    @Column(name = "role")
    private String role;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "device_info")
    private String deviceInfo;
}
