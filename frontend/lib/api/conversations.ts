import { apiRequest } from '@/lib/api/client'
import type {
  ConversationResponse,
  MessageResponse,
  SendMessageRequest,
  UserSummaryResponse,
} from '@/lib/types'

// GET /api/conversations
export function getConversations() {
  return apiRequest<ConversationResponse[]>('/conversations')
}

// POST /api/conversations/{userId}
export function createConversation(userId: number) {
  return apiRequest<ConversationResponse>(
    `/conversations/${userId}`,
    {
      method: 'POST',
    }
  )
}

// GET /api/conversations/{conversationId}/messages
export function getMessages(conversationId: number) {
  return apiRequest<MessageResponse[]>(
    `/conversations/${conversationId}/messages`
  )
}

// POST /api/conversations/messages
export function sendMessage(
  request: SendMessageRequest
) {
  return apiRequest<MessageResponse>(
    '/conversations/messages',
    {
      method: 'POST',
      body: request,
    }
  )
}

// GET /api/users/messaging
export function getMessagingUsers() {
  return apiRequest<UserSummaryResponse[]>(
    '/users/messaging'
  )
}