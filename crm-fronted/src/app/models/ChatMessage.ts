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
  isReadByCurrentUser?: boolean; // وضعیت خوانده شدن برای کاربر جاری
  selected?: boolean;
  isHiddenByCurrentUser?: boolean; // وضعیت مخفی شدن برای کاربر جاری
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
