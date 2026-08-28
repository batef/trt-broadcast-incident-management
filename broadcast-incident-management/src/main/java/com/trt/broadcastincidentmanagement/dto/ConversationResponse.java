package com.trt.broadcastincidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ConversationResponse {

    private Long id;

    private LocalDateTime createdAt;

    private List<UserSummaryResponse> participants;

    private String lastMessage;

    private LocalDateTime lastMessageAt;
}