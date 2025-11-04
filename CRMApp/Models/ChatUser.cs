using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class ChatUser
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }

        public ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
      
        public ICollection<ChatMessage> ReceivedMessages { get; set; } = new List<ChatMessage>();
      
        public ICollection<ChatConversationParticipant> Conversations { get; set; } = new List<ChatConversationParticipant>();
    }
}
