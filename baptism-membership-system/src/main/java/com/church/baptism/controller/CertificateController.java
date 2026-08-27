package com.church.baptism.controller;

import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.entity.audit.CertificateDownloadLog;
import com.church.baptism.entity.baptism.Baptism;
import com.church.baptism.entity.candidate.Candidate;
import com.church.baptism.entity.church.Church;
import com.church.baptism.entity.user.User;
import com.church.baptism.repository.audit.CertificateDownloadLogRepository;
import com.church.baptism.repository.baptism.BaptismRepository;
import com.church.baptism.repository.user.UserRepository;
import com.church.baptism.service.certificate.CertificateService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin("*")
public class CertificateController {

    private final CertificateService certificateService;
    private final CertificateDownloadLogRepository downloadLogRepository;
    private final BaptismRepository baptismRepository;
    private final UserRepository userRepository;

    private final String absoluteStoragePath;

    public CertificateController(
            CertificateService certificateService,
            CertificateDownloadLogRepository downloadLogRepository,
            BaptismRepository baptismRepository,
            UserRepository userRepository,
            @Value("${app.certificate-storage:uploads/certificates}") String certificateStoragePath
    ) {
        this.certificateService = certificateService;
        this.downloadLogRepository = downloadLogRepository;
        this.baptismRepository = baptismRepository;
        this.userRepository = userRepository;
        this.absoluteStoragePath = Paths.get(certificateStoragePath).toAbsolutePath().toString();
        try {
            Files.createDirectories(Paths.get(absoluteStoragePath));
        } catch (IOException e) {
            throw new RuntimeException("Could not create certificate storage directory", e);
        }
    }

    @GetMapping("/unsigned")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public List<BaptismResponse> getUnsigned() {
        return certificateService.getUnsignedCertificates();
    }

    @GetMapping("/verify/{certNumber}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certNumber) {
        Baptism baptism = baptismRepository.findByCertificateNumber(certNumber)
                .orElse(null);
        if (baptism == null) {
            return ResponseEntity.ok(java.util.Map.of(
                "valid", false,
                "message", "Certificate not found"
            ));
        }
        Candidate candidate = baptism.getCandidate();
        Church church = candidate != null ? candidate.getChurch() : null;
        String districtName = church != null && church.getDistrict() != null ? church.getDistrict().getName() : "";

        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("valid", true);
        result.put("certificateNumber", certNumber);
        result.put("candidateName", candidate != null ? candidate.getFullName() : "");
        result.put("baptismDate", baptism.getBaptismDate() != null ? baptism.getBaptismDate().toString() : "");
        result.put("location", baptism.getLocation() != null ? baptism.getLocation() : "");
        result.put("churchName", church != null ? church.getChurchName() : "");
        result.put("districtName", districtName);
        result.put("officiatingPastor", baptism.getOfficiatingPastor() != null ? baptism.getOfficiatingPastor() : "");
        result.put("certificateSigned", baptism.isCertificateSigned());
        result.put("signedAt", baptism.getSignedAt() != null ? baptism.getSignedAt().toString() : "");
        result.put("issuedOn", baptism.getBaptismDate() != null ? baptism.getBaptismDate().toString() : "");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all-baptized")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public List<BaptismResponse> getAllBaptized() {
        return certificateService.getAllBaptizedCertificates();
    }

    @GetMapping("/by-candidate/{candidateId}")
    public List<BaptismResponse> getByCandidate(@PathVariable Long candidateId) {
        return certificateService.getCertificatesByCandidate(candidateId);
    }

    @PutMapping("/{baptismId}/sign")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public ResponseEntity<?> signCertificate(
            @PathVariable Long baptismId,
            java.security.Principal principal
    ) {
        try {
            certificateService.signCertificate(baptismId, principal.getName());
            return ResponseEntity.ok(java.util.Map.of("message", "Certificate signed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{baptismId}/cms-transfer")
    @PreAuthorize("hasAnyRole('HEAD_OF_DISTRICT', 'HEAD_OF_RUM', 'ADMIN')")
    public BaptismResponse cmsTransfer(@PathVariable Long baptismId) {
        return certificateService.cmsTransfer(baptismId);
    }

    @GetMapping("/{baptismId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable Long baptismId,
            HttpServletRequest request,
            Principal principal
    ) throws IOException {

        Baptism baptism = baptismRepository.findById(baptismId)
                .orElseThrow(() -> new RuntimeException("Baptism not found"));

        if (!baptism.isCertificateSigned()) {
            throw new RuntimeException("Certificate has not been signed yet");
        }

        String certNumber = baptism.getCertificateNumber() != null ? baptism.getCertificateNumber() : "CERT-" + baptismId;
        Path filePath = Paths.get(absoluteStoragePath, certNumber + ".pdf");

        byte[] pdf;
        if (Files.exists(filePath) && Files.size(filePath) > 0) {
            pdf = Files.readAllBytes(filePath);
        } else {
            pdf = certificateService.generateCertificate(baptismId, principal != null ? principal.getName() : null);
            Files.createDirectories(Paths.get(absoluteStoragePath));
            Files.write(filePath, pdf);
        }

        // Log the download
        CertificateDownloadLog log = new CertificateDownloadLog();
        log.setBaptismId(baptismId);
        log.setCertificateNumber(certNumber);
        log.setCandidateName(baptism.getCandidate().getFullName());
        log.setCandidateId(baptism.getCandidate().getId());
        log.setIpAddress(request.getRemoteAddr());
        log.setDeviceInfo(request.getHeader("User-Agent"));

        if (principal != null) {
            log.setDownloadedBy(principal.getName());
            userRepository.findByEmail(principal.getName()).ifPresent(u -> {
                log.setDownloadedByName(u.getFullName());
                log.setRole(u.getRole().name());
            });
        } else {
            log.setDownloadedBy("anonymous");
        }
        downloadLogRepository.save(log);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + certNumber + ".pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
