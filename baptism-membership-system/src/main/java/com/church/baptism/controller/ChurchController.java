package com.church.baptism.controller;

import com.church.baptism.dto.request.ChurchRequest;
import com.church.baptism.dto.response.ChurchDetailResponse;
import com.church.baptism.dto.response.ChurchResponse;
import com.church.baptism.service.church.ChurchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/churches")
@RequiredArgsConstructor
public class ChurchController {

    private final ChurchService churchService;

    @PostMapping
    public ResponseEntity<ChurchResponse> createChurch(
            @RequestBody ChurchRequest request
    ) {
        return ResponseEntity.ok(
                churchService.createChurch(request)
        );
    }

    @GetMapping
    public ResponseEntity<List<ChurchResponse>> getAllChurches() {
        return ResponseEntity.ok(
                churchService.getAllChurches()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChurchResponse> getChurchById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                churchService.getChurchById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChurchResponse> updateChurch(
            @PathVariable Long id,
            @RequestBody ChurchRequest request
    ) {
        return ResponseEntity.ok(
                churchService.updateChurch(id, request)
        );
    }

    @PutMapping("/{churchId}/assign-pastor/{pastorId}")
    public ResponseEntity<ChurchResponse> assignPastorToChurch(
            @PathVariable Long churchId,
            @PathVariable Long pastorId
    ) {
        return ResponseEntity.ok(
                churchService.assignPastorToChurch(
                        churchId,
                        pastorId
                )
        );
    }

    @PutMapping("/{churchId}/unassign-pastor")
    public ResponseEntity<ChurchResponse> unassignPastor(
            @PathVariable Long churchId
    ) {
        return ResponseEntity.ok(
                churchService.unassignPastor(churchId)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteChurch(
            @PathVariable Long id
    ) {
        churchService.deleteChurch(id);

        return ResponseEntity.ok(
                "Church deleted successfully"
        );
    }

    // ====================== HIERARCHY DRILL-DOWN ======================

    @GetMapping("/by-district/{districtId}")
    public ResponseEntity<List<ChurchResponse>> getChurchesByDistrict(
            @PathVariable Long districtId
    ) {
        return ResponseEntity.ok(churchService.getChurchesByDistrict(districtId));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<ChurchDetailResponse> getChurchDetail(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        return ResponseEntity.ok(churchService.getChurchDetail(id, dateFrom, dateTo));
    }
}