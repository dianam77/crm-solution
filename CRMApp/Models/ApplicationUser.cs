using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string? FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
        public ICollection<ChatMessageRecipient> ReceivedMessages { get; set; } = new List<ChatMessageRecipient>();
        public ICollection<ChatConversationParticipant> Conversations { get; set; } = new List<ChatConversationParticipant>();
    }
}
