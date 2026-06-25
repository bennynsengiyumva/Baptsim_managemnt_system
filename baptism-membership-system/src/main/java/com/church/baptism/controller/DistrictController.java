package com.church.baptism.controller;

import com.church.baptism.dto.request.DistrictRequest;
import com.church.baptism.dto.response.DistrictResponse;
import com.church.baptism.service.church.DistrictService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/districts")
@RequiredArgsConstructor
public class DistrictController {

    private final DistrictService districtService;

    @GetMapping
    public ResponseEntity<List<DistrictResponse>> getAll() {
        return ResponseEntity.ok(districtService.getAll());
    }

    @GetMapping("/by-field/{fieldId}")
    public ResponseEntity<List<DistrictResponse>> getByField(@PathVariable Long fieldId) {
        return ResponseEntity.ok(districtService.getByField(fieldId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DistrictResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(districtService.getById(id));
    }

    @PostMapping
    public ResponseEntity<DistrictResponse> create(@RequestBody DistrictRequest request) {
        return ResponseEntity.ok(districtService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DistrictResponse> update(@PathVariable Long id, @RequestBody DistrictRequest request) {
        return ResponseEntity.ok(districtService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        districtService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
