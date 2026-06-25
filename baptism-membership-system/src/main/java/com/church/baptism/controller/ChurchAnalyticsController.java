package com.church.baptism.controller;

import com.church.baptism.dto.dashboard.ChurchAnalyticsResponse;
import com.church.baptism.service.dashboard.ChurchAnalyticsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard/church")
public class ChurchAnalyticsController {

    private final ChurchAnalyticsService service;

    public ChurchAnalyticsController(
            ChurchAnalyticsService service
    ) {
        this.service = service;
    }

    @GetMapping("/{church}")
    public ChurchAnalyticsResponse analytics(
            @PathVariable String church
    ) {
        return service.getChurchAnalytics(church);
    }
}