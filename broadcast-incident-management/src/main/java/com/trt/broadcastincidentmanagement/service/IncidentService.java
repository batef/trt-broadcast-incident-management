package com.trt.broadcastincidentmanagement.service;

import com.trt.broadcastincidentmanagement.dto.IncidentHistoryResponse;
import com.trt.broadcastincidentmanagement.dto.IncidentRequest;
import com.trt.broadcastincidentmanagement.dto.IncidentResponse;
import com.trt.broadcastincidentmanagement.entity.Incident;
import com.trt.broadcastincidentmanagement.entity.IncidentHistory;
import com.trt.broadcastincidentmanagement.entity.User;
import com.trt.broadcastincidentmanagement.enums.IncidentStatus;
import com.trt.broadcastincidentmanagement.enums.Role;
import com.trt.broadcastincidentmanagement.repository.IncidentHistoryRepository;
import com.trt.broadcastincidentmanagement.repository.IncidentRepository;
import com.trt.broadcastincidentmanagement.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final IncidentHistoryRepository incidentHistoryRepository;
    private final EmailService emailService;

    public IncidentService(
            IncidentRepository incidentRepository,
            UserRepository userRepository,
            IncidentHistoryRepository incidentHistoryRepository,
            EmailService emailService) {

        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.incidentHistoryRepository = incidentHistoryRepository;
        this.emailService = emailService;
    }

    // Tüm incidentları getir
    public List<IncidentResponse> getAllIncidents() {

        return incidentRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ID'ye göre incident getir
    public Optional<IncidentResponse> getIncidentById(Long id) {

        return incidentRepository.findById(id)
                .map(this::convertToResponse);
    }

    // Yeni incident oluştur
    public IncidentResponse createIncident(
            IncidentRequest request) {

        Incident incident = new Incident();

        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setPriority(request.getPriority());
        incident.setStatus(request.getStatus());

        User currentUser =
                (User) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        incident.setCreatedBy(currentUser);

        Incident savedIncident =
                incidentRepository.save(incident);

        IncidentHistory history =
                new IncidentHistory();

        history.setIncident(savedIncident);
        history.setUser(currentUser);
        history.setAction("CREATED");
        history.setDetails("Incident created");
        history.setCreatedAt(
                LocalDateTime.now()
        );

        incidentHistoryRepository.save(history);

        return convertToResponse(
                savedIncident
        );
    }

    // Incident güncelle
    public IncidentResponse updateIncident(
            Long id,
            IncidentRequest request) {

        Incident existingIncident =
                incidentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Incident not found"
                                )
                        );

        existingIncident.setTitle(
                request.getTitle()
        );

        existingIncident.setDescription(
                request.getDescription()
        );

        existingIncident.setPriority(
                request.getPriority()
        );

        existingIncident.setStatus(
                request.getStatus()
        );

        Incident savedIncident =
                incidentRepository.save(
                        existingIncident
                );

        return convertToResponse(
                savedIncident
        );
    }

    // Incident sil.
    //
    // IncidentHistory kayıtları incidents tablosuna
    // FK ile bağlı olduğu için önce history kayıtları,
    // ardından incident silinir.
    @org.springframework.transaction.annotation.Transactional
    public void deleteIncident(Long id) {

        if (!incidentRepository.existsById(id)) {

            throw new RuntimeException(
                    "Incident not found"
            );
        }

        incidentHistoryRepository
                .deleteByIncidentId(id);

        incidentRepository.deleteById(id);
    }

    // Incident'ı technician'a ata
    public IncidentResponse assignIncident(
            Long incidentId,
            Long userId) {

        /*
         * Incident kontrolü
         */
        Incident incident =
                incidentRepository.findById(incidentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Incident not found"
                                )
                        );

        /*
         * Kullanıcı kontrolü
         */
        User user =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        /*
         * Kullanıcının gerçekten technician
         * olduğundan emin ol.
         */
        if (user.getRole() != Role.TECHNICIAN) {

            throw new RuntimeException(
                    "User must be a technician"
            );
        }

        /*
         * Aynı teknisyene aynı olayı tekrar
         * atamayı engelle.
         */
        if (incident.getAssignedTo() != null &&
                incident.getAssignedTo()
                        .getId()
                        .equals(userId)) {

            throw new RuntimeException(
                    "Bu olay zaten bu teknisyene atanmış."
            );
        }

        /*
         * Olayı teknisyene ata.
         */
        incident.setAssignedTo(user);

        Incident savedIncident =
                incidentRepository.save(incident);

        /*
         * Atamayı yapan kullanıcı.
         */
        User currentUser =
                (User) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        /*
         * History kaydı oluştur.
         */
        IncidentHistory history =
                new IncidentHistory();

        history.setIncident(
                savedIncident
        );

        history.setUser(
                currentUser
        );

        history.setAction(
                "ASSIGNED"
        );

        history.setDetails(
                "Incident assigned to "
                        + user.getUsername()
        );

        history.setCreatedAt(
                LocalDateTime.now()
        );

        incidentHistoryRepository.save(
                history
        );

        /*
         * ==========================================
         * TEKNİSYENE HTML MAIL GÖNDER
         * ==========================================
         *
         * Olay başarıyla atandıktan sonra
         * teknisyenin kayıtlı e-posta adresine
         * olay detaylarını içeren HTML mail
         * gönderiyoruz.
         */
        try {

            emailService.sendIncidentAssignedEmail(
                    user.getEmail(),
                    user.getUsername(),
                    savedIncident
            );

        } catch (Exception e) {

            /*
             * Mail gönderilemese bile olay
             * atamasını geri almıyoruz.
             *
             * DB:
             *   Atama       ✓
             *   History     ✓
             *   Mail        ✗
             *
             * Böylece mail problemi yüzünden
             * olay ataması kaybolmaz.
             */
            System.err.println(
                    "Olay atama maili gönderilemedi: "
                            + e.getMessage()
            );
        }

        return convertToResponse(
                savedIncident
        );
    }

    // Technician'ın kendisine atanmış incidentları
    public List<IncidentResponse> getMyAssignedIncidents() {

        User currentUser =
                (User) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return incidentRepository
                .findByAssignedToId(
                        currentUser.getId()
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // Incident status güncelle
    public IncidentResponse updateIncidentStatus(
            Long incidentId,
            IncidentStatus newStatus) {

        Incident incident =
                incidentRepository.findById(incidentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Incident not found"
                                )
                        );

        User currentUser =
                (User) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        /*
         * Sadece olay kendisine atanmış technician
         * tarafından status değiştirebilir.
         */
        if (incident.getAssignedTo() == null ||
                !incident.getAssignedTo()
                        .getId()
                        .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You can only update incidents assigned to you"
            );
        }

        IncidentStatus oldStatus =
                incident.getStatus();

        /*
         * OPEN -> IN_PROGRESS
         */
        if (oldStatus == IncidentStatus.OPEN &&
                newStatus != IncidentStatus.IN_PROGRESS) {

            throw new RuntimeException(
                    "OPEN incident must be moved to IN_PROGRESS first"
            );
        }

        /*
         * IN_PROGRESS -> RESOLVED
         */
        if (oldStatus == IncidentStatus.IN_PROGRESS &&
                newStatus != IncidentStatus.RESOLVED) {

            throw new RuntimeException(
                    "IN_PROGRESS incident must be moved to RESOLVED"
            );
        }

        /*
         * RESOLVED tekrar açılamaz.
         */
        if (oldStatus == IncidentStatus.RESOLVED) {

            throw new RuntimeException(
                    "Resolved incident cannot be reopened"
            );
        }

        incident.setStatus(
                newStatus
        );

        Incident savedIncident =
                incidentRepository.save(
                        incident
                );

        /*
         * Status history
         */
        IncidentHistory history =
                new IncidentHistory();

        history.setIncident(
                savedIncident
        );

        history.setUser(
                currentUser
        );

        history.setAction(
                "STATUS_CHANGED"
        );

        history.setDetails(
                "Status changed from "
                        + oldStatus
                        + " to "
                        + newStatus
        );

        history.setCreatedAt(
                LocalDateTime.now()
        );

        incidentHistoryRepository.save(
                history
        );

        return convertToResponse(
                savedIncident
        );
    }

    // Incident history
    public List<IncidentHistoryResponse> getIncidentHistory(
            Long incidentId) {

        return incidentHistoryRepository
                .findByIncidentIdOrderByCreatedAtDesc(
                        incidentId
                )
                .stream()
                .map(history ->
                        new IncidentHistoryResponse(
                                history.getId(),
                                history.getAction(),
                                history.getDetails(),
                                history.getCreatedAt(),
                                history.getUser()
                                        .getUsername()
                        )
                )
                .toList();
    }

    /*
     * Incident -> IncidentResponse
     */
    private IncidentResponse convertToResponse(
            Incident incident) {

        String createdByUsername =
                incident.getCreatedBy() != null
                        ? incident
                        .getCreatedBy()
                        .getUsername()
                        : null;

        String assignedToUsername =
                incident.getAssignedTo() != null
                        ? incident
                        .getAssignedTo()
                        .getUsername()
                        : null;

        return new IncidentResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getPriority(),
                incident.getStatus(),
                incident.getCreatedAt(),
                createdByUsername,
                assignedToUsername
        );
    }
}