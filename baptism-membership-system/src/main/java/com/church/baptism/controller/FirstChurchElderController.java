package com.church.baptism.controller;

import com.church.baptism.dto.request.FirstChurchElderRequest;
import com.church.baptism.dto.response.FirstChurchElderResponse;
import com.church.baptism.service.elder.FirstChurchElderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/first-church-elders")
@RequiredArgsConstructor
public class FirstChurchElderController {

    private final FirstChurchElderService elderService;

    @GetMapping
    public ResponseEntity<List<FirstChurchElderResponse>> getAll() {
        return ResponseEntity.ok(elderService.getAll());
    }

    @GetMapping("/by-church/{churchId}")
    public ResponseEntity<List<FirstChurchElderResponse>> getByChurch(@PathVariable Long churchId) {
        return ResponseEntity.ok(elderService.getByChurch(churchId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FirstChurchElderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(elderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<FirstChurchElderResponse> create(@RequestBody FirstChurchElderRequest request) {
        return ResponseEntity.ok(elderService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FirstChurchElderResponse> update(@PathVariable Long id, @RequestBody FirstChurchElderRequest request) {
        return ResponseEntity.ok(elderService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        elderService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
