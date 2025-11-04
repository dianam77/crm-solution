using System;

namespace CRMApp.Models
{
    public class ChatMessageRecipient
    {
        public int Id { get; set; }

        public int ChatMessageId { get; set; }
        public ChatMessage ChatMessage { get; set; }

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; }

        public bool IsRead { get; set; } = false; 

        public bool IsHidden { get; set; } = false; 
    }
}
