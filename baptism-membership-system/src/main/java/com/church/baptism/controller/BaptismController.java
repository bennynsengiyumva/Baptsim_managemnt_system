package com.church.baptism.controller;

import com.church.baptism.dto.request.BaptismEventRequest;
import com.church.baptism.dto.request.BaptismRegistrationRequest;
import com.church.baptism.dto.response.BaptismEventResponse;
import com.church.baptism.dto.response.BaptismResponse;
import com.church.baptism.service.baptism.BaptismService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/baptisms")
public class BaptismController {

    private final BaptismService baptismService;

    public BaptismController(BaptismService baptismService) {
        this.baptismService = baptismService;
    }

    // ===================== EVENTS =====================

    @PostMapping("/events")
    public BaptismEventResponse createEvent(@RequestBody BaptismEventRequest request) {
        return baptismService.createEvent(request);
    }

    @GetMapping("/events")
    public List<BaptismEventResponse> getAllEvents() {
        return baptismService.getAllEvents();
    }

    @GetMapping("/events/upcoming")
    public List<BaptismEventResponse> getUpcomingEvents() {
        return baptismService.getUpcomingEvents();
    }

    @GetMapping("/events/{eventId}")
    public BaptismEventResponse getEventById(@PathVariable Long eventId) {
        return baptismService.getEventById(eventId);
    }

    @PutMapping("/events/{eventId}/status")
    public BaptismEventResponse updateEventStatus(
            @PathVariable Long eventId,
            @RequestParam String status
    ) {
        return baptismService.updateEventStatus(eventId, status);
    }

    // ===================== REGISTRATION =====================

    @PostMapping("/register")
    public BaptismResponse register(@RequestBody BaptismRegistrationRequest request) {
        return baptismService.registerCandidate(request);
    }

    @DeleteMapping("/{baptismId}/unregister")
    public void unregister(@PathVariable Long baptismId) {
        baptismService.unregisterCandidate(baptismId);
    }

    // ===================== APPROVAL =====================

    @PutMapping("/approve")
    public BaptismResponse approve(
            @RequestParam Long eventId,
            @RequestParam Long candidateId
    ) {
        return baptismService.approveRegistration(eventId, candidateId);
    }

    // ===================== CONFIRMATION =====================

    @PostMapping("/{baptismId}/confirm")
    public BaptismResponse confirm(
            @PathVariable Long baptismId,
            @RequestParam(required = false) List<MultipartFile> photos
    ) {
        return baptismService.confirmBaptism(baptismId, photos);
    }

    @PutMapping("/{baptismId}/order")
    public void updateOrder(
            @PathVariable Long baptismId,
            @RequestParam int order
    ) {
        baptismService.updateBaptismOrder(baptismId, order);
    }

    // ===================== HISTORY =====================

    @GetMapping
    public List<BaptismResponse> getAll() {
        return baptismService.getAllBaptisms();
    }

    @GetMapping("/baptized")
    public List<BaptismResponse> getBaptized() {
        return baptismService.getBaptizedCandidates();
    }

    @GetMapping("/by-candidate/{candidateId}")
    public List<BaptismResponse> getByCandidate(@PathVariable Long candidateId) {
        return baptismService.getBaptismsByCandidate(candidateId);
    }

    // ===================== EXPORT =====================

    @GetMapping("/export")
    public ResponseEntity<byte[]> export() {
        String csv = baptismService.exportBaptismRecords();
        byte[] bytes = csv.getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=baptism-records.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
