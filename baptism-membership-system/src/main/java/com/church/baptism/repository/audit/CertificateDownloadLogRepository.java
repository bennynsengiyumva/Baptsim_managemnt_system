package com.church.baptism.repository.audit;

import com.church.baptism.entity.audit.CertificateDownloadLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificateDownloadLogRepository extends JpaRepository<CertificateDownloadLog, Long> {
    List<CertificateDownloadLog> findByBaptismIdOrderByCreatedAtDesc(Long baptismId);
    List<CertificateDownloadLog> findAllByOrderByCreatedAtDesc();
    long countByBaptismId(Long baptismId);
    List<CertificateDownloadLog> findTop20ByOrderByCreatedAtDesc();
}
