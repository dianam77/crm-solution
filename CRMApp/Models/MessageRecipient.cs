using System;

namespace CRMApp.Models
{
    public class MessageRecipient
    {
        public int Id { get; set; }

        public int MessageId { get; set; }
        public ChatMessage Message { get; set; }

        public Guid ReceiverId { get; set; }
        public ApplicationUser Receiver { get; set; }

        public bool IsRead { get; set; } = false;
    }
}
