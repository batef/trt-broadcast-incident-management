package com.trt.broadcastincidentmanagement.repository;

import com.trt.broadcastincidentmanagement.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationParticipantRepository
        extends JpaRepository<ConversationParticipant, Long> {

    List<ConversationParticipant> findByConversationId(
            Long conversationId
    );

    Optional<ConversationParticipant> findByConversationIdAndUserId(
            Long conversationId,
            Long userId
    );

    boolean existsByConversationIdAndUserId(
            Long conversationId,
            Long userId
    );

    List<ConversationParticipant> findByUserId(
            Long userId
    );
}