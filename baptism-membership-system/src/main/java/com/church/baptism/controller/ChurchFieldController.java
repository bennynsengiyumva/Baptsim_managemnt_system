package com.church.baptism.controller;

import com.church.baptism.dto.request.ChurchFieldRequest;
import com.church.baptism.dto.response.ChurchFieldResponse;
import com.church.baptism.service.church.ChurchFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fields")
@RequiredArgsConstructor
public class ChurchFieldController {

    private final ChurchFieldService fieldService;

    @GetMapping
    public ResponseEntity<List<ChurchFieldResponse>> getAll() {
        return ResponseEntity.ok(fieldService.getAll());
    }

    @GetMapping("/by-union/{unionId}")
    public ResponseEntity<List<ChurchFieldResponse>> getByUnion(@PathVariable Long unionId) {
        return ResponseEntity.ok(fieldService.getByUnion(unionId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChurchFieldResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(fieldService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ChurchFieldResponse> create(@RequestBody ChurchFieldRequest request) {
        return ResponseEntity.ok(fieldService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChurchFieldResponse> update(@PathVariable Long id, @RequestBody ChurchFieldRequest request) {
        return ResponseEntity.ok(fieldService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        fieldService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
