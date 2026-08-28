package com.trt.broadcastincidentmanagement.controller;

import com.trt.broadcastincidentmanagement.dto.ConversationResponse;
import com.trt.broadcastincidentmanagement.dto.MessageResponse;
import com.trt.broadcastincidentmanagement.dto.SendMessageRequest;
import com.trt.broadcastincidentmanagement.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(
            ConversationService conversationService) {

        this.conversationService = conversationService;
    }

    /**
     * Belirli bir kullanıcıyla yeni konuşma oluşturur.
     *
     * POST /api/conversations/{userId}
     */
    @PostMapping("/{userId}")
    public ResponseEntity<ConversationResponse> createConversation(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                conversationService.createConversation(
                        userId
                )
        );
    }

    /**
     * Giriş yapan kullanıcının tüm konuşmalarını getirir.
     *
     * GET /api/conversations
     */
    @GetMapping
    public ResponseEntity<List<ConversationResponse>>
    getMyConversations() {

        return ResponseEntity.ok(
                conversationService.getMyConversations()
        );
    }

    /**
     * Bir konuşmadaki mesajları getirir.
     *
     * GET /api/conversations/{conversationId}/messages
     */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>>
    getMessages(
            @PathVariable Long conversationId) {

        return ResponseEntity.ok(
                conversationService.getMessages(
                        conversationId
                )
        );
    }

    /**
     * Konuşmaya mesaj gönderir.
     *
     * POST /api/conversations/messages
     */
    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {

        return ResponseEntity.ok(
                conversationService.sendMessage(
                        request
                )
        );
    }
}