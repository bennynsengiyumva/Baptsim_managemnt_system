package com.church.baptism.controller;

import com.church.baptism.dto.request.UnionRequest;
import com.church.baptism.dto.response.UnionResponse;
import com.church.baptism.service.church.UnionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/unions")
@RequiredArgsConstructor
public class UnionController {

    private final UnionService unionService;

    @GetMapping
    public ResponseEntity<List<UnionResponse>> getAll() {
        return ResponseEntity.ok(unionService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UnionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(unionService.getById(id));
    }

    @PostMapping
    public ResponseEntity<UnionResponse> create(@RequestBody UnionRequest request) {
        return ResponseEntity.ok(unionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnionResponse> update(@PathVariable Long id, @RequestBody UnionRequest request) {
        return ResponseEntity.ok(unionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        unionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
