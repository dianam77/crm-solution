using CRMApp.Models;

public class ChatConversationParticipant
{
    public int Id { get; set; }

    public int ConversationId { get; set; }
    public ChatConversation Conversation { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; }  // فقط ApplicationUser
}