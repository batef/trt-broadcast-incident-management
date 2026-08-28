package com.trt.broadcastincidentmanagement.service;

import com.trt.broadcastincidentmanagement.dto.ConversationResponse;
import com.trt.broadcastincidentmanagement.dto.MessageResponse;
import com.trt.broadcastincidentmanagement.dto.SendMessageRequest;
import com.trt.broadcastincidentmanagement.dto.UserSummaryResponse;
import com.trt.broadcastincidentmanagement.entity.Conversation;
import com.trt.broadcastincidentmanagement.entity.ConversationParticipant;
import com.trt.broadcastincidentmanagement.entity.Message;
import com.trt.broadcastincidentmanagement.entity.User;
import com.trt.broadcastincidentmanagement.repository.ConversationParticipantRepository;
import com.trt.broadcastincidentmanagement.repository.ConversationRepository;
import com.trt.broadcastincidentmanagement.repository.MessageRepository;
import com.trt.broadcastincidentmanagement.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ConversationService(
            ConversationRepository conversationRepository,
            ConversationParticipantRepository participantRepository,
            MessageRepository messageRepository,
            UserRepository userRepository) {

        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    /**
     * Yeni bir kullanıcıyla birebir konuşma oluşturur.
     */
    public ConversationResponse createConversation(
            Long otherUserId) {

        User currentUser = getCurrentUser();

        if (currentUser.getId().equals(otherUserId)) {
            throw new RuntimeException(
                    "Kendinizle konuşma oluşturamazsınız."
            );
        }

        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Kullanıcı bulunamadı."
                        )
                );

        /*
         * Aynı iki kullanıcı arasında zaten konuşma var mı?
         */
        List<ConversationParticipant> currentUserConversations =
                participantRepository.findByUserId(
                        currentUser.getId()
                );

        for (ConversationParticipant participant :
                currentUserConversations) {

            Conversation conversation =
                    participant.getConversation();

            if (participantRepository
                    .existsByConversationIdAndUserId(
                            conversation.getId(),
                            otherUser.getId()
                    )) {

                return convertToConversationResponse(
                        conversation
                );
            }
        }

        /*
         * Yeni conversation oluştur.
         */
        Conversation conversation =
                new Conversation();

        conversation =
                conversationRepository.save(
                        conversation
                );

        /*
         * Mevcut kullanıcıyı ekle.
         */
        ConversationParticipant firstParticipant =
                new ConversationParticipant();

        firstParticipant.setConversation(
                conversation
        );

        firstParticipant.setUser(
                currentUser
        );

        participantRepository.save(
                firstParticipant
        );

        /*
         * Diğer kullanıcıyı ekle.
         */
        ConversationParticipant secondParticipant =
                new ConversationParticipant();

        secondParticipant.setConversation(
                conversation
        );

        secondParticipant.setUser(
                otherUser
        );

        participantRepository.save(
                secondParticipant
        );

        return convertToConversationResponse(
                conversation
        );
    }

    /**
     * Giriş yapan kullanıcının konuşmalarını getirir.
     */
    public List<ConversationResponse> getMyConversations() {

        User currentUser = getCurrentUser();

        return participantRepository
                .findByUserId(currentUser.getId())
                .stream()
                .map(
                        ConversationParticipant::getConversation
                )
                .map(this::convertToConversationResponse)
                .toList();
    }

    /**
     * Bir conversation içindeki mesajları getirir.
     */
    public List<MessageResponse> getMessages(
            Long conversationId) {

        User currentUser = getCurrentUser();

        ensureParticipant(
                conversationId,
                currentUser.getId()
        );

        return messageRepository
                .findByConversationIdOrderByCreatedAtAsc(
                        conversationId
                )
                .stream()
                .map(this::convertToMessageResponse)
                .toList();
    }

    /**
     * Conversation'a mesaj gönder.
     */
    public MessageResponse sendMessage(
            SendMessageRequest request) {

        User currentUser = getCurrentUser();

        ensureParticipant(
                request.getConversationId(),
                currentUser.getId()
        );

        String content =
                request.getContent() != null
                        ? request.getContent().trim()
                        : "";

        if (content.isBlank()) {
            throw new RuntimeException(
                    "Mesaj boş olamaz."
            );
        }

        Message message =
                new Message();

        Conversation conversation =
                conversationRepository
                        .findById(
                                request.getConversationId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Konuşma bulunamadı."
                                )
                        );

        message.setConversation(
                conversation
        );

        message.setSender(
                currentUser
        );

        message.setContent(
                content
        );

        message.setRead(
                false
        );

        Message savedMessage =
                messageRepository.save(
                        message
                );

        return convertToMessageResponse(
                savedMessage
        );
    }

    /**
     * Kullanıcının conversation'a dahil olup olmadığını kontrol eder.
     */
    private void ensureParticipant(
            Long conversationId,
            Long userId) {

        boolean participant =
                participantRepository
                        .existsByConversationIdAndUserId(
                                conversationId,
                                userId
                        );

        if (!participant) {

            throw new RuntimeException(
                    "Bu konuşmaya erişim yetkiniz bulunmuyor."
            );
        }
    }

    /**
     * JWT üzerinden giriş yapan kullanıcıyı getirir.
     */
    private User getCurrentUser() {

        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    /**
     * Conversation entity -> DTO
     */
    private ConversationResponse
    convertToConversationResponse(
            Conversation conversation) {

        List<UserSummaryResponse> participants =
                participantRepository
                        .findByConversationId(
                                conversation.getId()
                        )
                        .stream()
                        .map(participant -> {

                            User user =
                                    participant.getUser();

                            return new UserSummaryResponse(
                                    user.getId(),
                                    user.getUsername(),
                                    user.getEmail(),
                                    user.getRole(),
                                    false,
                                    0
                            );
                        })
                        .toList();

        List<Message> messages =
                messageRepository
                        .findByConversationIdOrderByCreatedAtAsc(
                                conversation.getId()
                        );

        String lastMessage = null;

        java.time.LocalDateTime lastMessageAt =
                null;

        if (!messages.isEmpty()) {

            Message last =
                    messages.get(
                            messages.size() - 1
                    );

            lastMessage =
                    last.getContent();

            lastMessageAt =
                    last.getCreatedAt();
        }

        return new ConversationResponse(
                conversation.getId(),
                conversation.getCreatedAt(),
                participants,
                lastMessage,
                lastMessageAt
        );
    }

    /**
     * Message entity -> DTO
     */
    private MessageResponse
    convertToMessageResponse(
            Message message) {

        return new MessageResponse(
                message.getId(),
                message.getConversation()
                        .getId(),
                message.getSender()
                        .getId(),
                message.getSender()
                        .getUsername(),
                message.getContent(),
                message.getCreatedAt(),
                message.isRead()
        );
    }
}