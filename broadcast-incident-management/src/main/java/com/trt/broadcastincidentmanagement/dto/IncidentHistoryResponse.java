package com.trt.broadcastincidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class IncidentHistoryResponse {

    private Long id;
    private String action;
    private String details;
    private LocalDateTime createdAt;
    private String username;
}