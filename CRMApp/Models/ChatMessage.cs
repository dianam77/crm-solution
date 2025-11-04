using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.Models
{
    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public Guid SenderId { get; set; }
        public ApplicationUser Sender { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int ConversationId { get; set; }
        public ChatConversation Conversation { get; set; }

   
        public ICollection<ChatMessageRecipient> Recipients { get; set; } = new List<ChatMessageRecipient>();
    }
}
