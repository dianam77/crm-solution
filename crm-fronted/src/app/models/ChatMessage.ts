export interface ChatUser {
  id: string;
  userName: string;
}

export interface ChatMessage {
  id: number;
  senderId: string;
  senderName?: string;
  receiverIds: string[];
  content: string;
  createdAt: string | Date;
  isReadByCurrentUser?: boolean; 
  selected?: boolean;
  isHiddenByCurrentUser?: boolean;
}

export interface CreateChatMessageDto {
  senderId: string;
  receiverIds: string[];
  content: string;
  conversationId: number;
}

export interface ChatConversation {
  id: number;
  participants: ChatUser[];
  messages: ChatMessage[];
}
