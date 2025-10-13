using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class ChatConversation
    {
        public int Id { get; set; }
        public string Name { get; set; } // Optional

        public ICollection<ChatConversationParticipant> Participants { get; set; } = new List<ChatConversationParticipant>();
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public class ChatConversationParticipant
    {
        public int Id { get; set; }

        public int ConversationId { get; set; }
        public ChatConversation Conversation { get; set; }

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; }  // فقط ApplicationUser
    }
}
