using System;
using System.Collections.Generic;

namespace CRMApp.DTOs
{
    public class CreateChatMessageDto
    {
        public Guid SenderId { get; set; }
        public List<Guid> ReceiverIds { get; set; }  // اضافه شد
        public string Content { get; set; }
        public int ConversationId { get; set; }
    }
}
