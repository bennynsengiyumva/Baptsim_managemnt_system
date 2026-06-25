package com.church.baptism.controller;

import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.service.certificate.CertificateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@CrossOrigin("*")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(
            CertificateService certificateService
    ) {
        this.certificateService = certificateService;
    }

    @GetMapping("/unsigned")
    public List<BaptismResponse> getUnsigned() {
        return certificateService.getUnsignedCertificates();
    }

    @PutMapping("/{baptismId}/sign")
    public void signCertificate(
            @PathVariable Long baptismId,
            java.security.Principal principal
    ) {
        certificateService.signCertificate(baptismId, principal.getName());
    }

    @GetMapping("/{baptismId}/download")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable Long baptismId
    ) {

        byte[] pdf =
                certificateService.generateCertificate(baptismId);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=baptism-certificate.pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}