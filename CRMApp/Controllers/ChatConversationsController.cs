using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers.Api.Chat
{
    [Route("api/chat/conversations")]
    [ApiController]
    [Authorize]
    public class ChatConversationsController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public ChatConversationsController(CRMAppDbContext context)
        {
            _context = context;
        }

        // GET: api/chat/conversations
        [HttpGet]
        public async Task<IActionResult> GetConversations()
        {
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier).Value);

            var conversations = await _context.ChatConversations
                .Include(c => c.Participants)
                    .ThenInclude(p => p.User)
                .Include(c => c.Messages)
                .Where(c => c.Participants.Any(p => p.UserId == userId))
                .ToListAsync();

            return Ok(conversations);
        }

        // POST: api/chat/conversations
        [HttpPost]
        public async Task<IActionResult> CreateConversation([FromBody] CreateChatConversationDto dto)
        {
            var conversation = new ChatConversation();

            foreach (var userId in dto.ParticipantIds)
            {
                conversation.Participants.Add(new ChatConversationParticipant
                {
                    UserId = userId
                });
            }

            _context.ChatConversations.Add(conversation);
            await _context.SaveChangesAsync();

            return Ok(conversation);
        }

        // DELETE: api/chat/conversations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConversation(int id)
        {
            var conversation = await _context.ChatConversations
                .Include(c => c.Messages)
                .Include(c => c.Participants)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (conversation == null) return NotFound();

            _context.ChatMessages.RemoveRange(conversation.Messages);
            _context.ChatConversations.Remove(conversation);

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
