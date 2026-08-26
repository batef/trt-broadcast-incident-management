package com.trt.broadcastincidentmanagement.dto;

import com.trt.broadcastincidentmanagement.enums.IncidentStatus;
import com.trt.broadcastincidentmanagement.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class IncidentResponse {

    private Long id;
    private String title;
    private String description;
    private Priority priority;
    private IncidentStatus status;
    private LocalDateTime createdAt;

    private String createdByUsername;
    private String assignedToUsername;
}