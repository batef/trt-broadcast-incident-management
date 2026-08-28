package com.trt.broadcastincidentmanagement.repository;

import com.trt.broadcastincidentmanagement.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository
        extends JpaRepository<Conversation, Long> {
}