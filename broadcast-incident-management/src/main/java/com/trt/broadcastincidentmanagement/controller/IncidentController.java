package com.trt.broadcastincidentmanagement.controller;

import com.trt.broadcastincidentmanagement.dto.IncidentHistoryResponse;
import com.trt.broadcastincidentmanagement.dto.IncidentRequest;
import com.trt.broadcastincidentmanagement.dto.IncidentResponse;
import com.trt.broadcastincidentmanagement.enums.IncidentStatus;
import com.trt.broadcastincidentmanagement.service.IncidentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@SecurityRequirement(name = "bearerAuth")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    // Tüm incidentları getir
    @GetMapping
    public List<IncidentResponse> getAllIncidents() {
        return incidentService.getAllIncidents();
    }

    // ID'ye göre incident getir
    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncidentById(
            @PathVariable Long id) {

        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Yeni incident oluştur
    @PostMapping
    public IncidentResponse createIncident(
            @RequestBody IncidentRequest request) {

        return incidentService.createIncident(request);
    }

    // Incident güncelle
    @PutMapping("/{id}")
    public IncidentResponse updateIncident(
            @PathVariable Long id,
            @RequestBody IncidentRequest request) {

        return incidentService.updateIncident(id, request);
    }

    // Incident sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(
            @PathVariable Long id) {

        incidentService.deleteIncident(id);

        return ResponseEntity.noContent().build();
    }

    // Incident'ı technician'a ata
    @PutMapping("/{id}/assign/{userId}")
    public IncidentResponse assignIncident(
            @PathVariable Long id,
            @PathVariable Long userId) {

        return incidentService.assignIncident(id, userId);
    }

    // Technician'ın kendisine atanmış incidentları
    @GetMapping("/assigned-to-me")
    public List<IncidentResponse> getMyAssignedIncidents() {

        return incidentService.getMyAssignedIncidents();
    }

    // Incident status güncelle
    @PutMapping("/{id}/status")
    public IncidentResponse updateIncidentStatus(
            @PathVariable Long id,
            @RequestParam IncidentStatus status) {

        return incidentService.updateIncidentStatus(id, status);
    }

    // Incident history
    @GetMapping("/{id}/history")
    public List<IncidentHistoryResponse> getIncidentHistory(
            @PathVariable Long id) {

        return incidentService.getIncidentHistory(id);
    }
}