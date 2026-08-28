package com.trt.broadcastincidentmanagement.dto;

import com.trt.broadcastincidentmanagement.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class UserDetailsResponse {

    private Long id;
    private String username;
    private String email;
    private Role role;

    private List<IncidentResponse> createdIncidents;
    private List<IncidentResponse> assignedIncidents;
}