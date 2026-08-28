package com.trt.broadcastincidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class MessageResponse {

    private Long id;

    private Long conversationId;

    private Long senderId;

    private String senderUsername;

    private String content;

    private LocalDateTime createdAt;

    private boolean read;
}