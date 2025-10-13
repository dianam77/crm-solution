using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace CRMApp.Controllers
{
    [Route("api/chat/messages")]
    [ApiController]
    [Authorize]
    public class ChatMessagesController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public ChatMessagesController(CRMAppDbContext context)
        {
            _context = context;
        }

        // =============================
        // 1. دریافت پیام‌ها
        // =============================
        [HttpGet]
        public async Task<IActionResult> GetMessages([FromQuery] int? conversationId)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("کاربر احراز هویت نشده است.");

            var userId = Guid.Parse(userIdClaim);

            var query = _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Recipients)
                    .ThenInclude(r => r.User)
                .AsQueryable();

            // فیلتر بر اساس conversationId یا پیام‌های مربوط به کاربر
            if (conversationId.HasValue && conversationId.Value > 0)
            {
                query = query.Where(m => m.ConversationId == conversationId.Value);
            }
            else
            {
                query = query.Where(m =>
                    m.SenderId == userId ||
                    m.Recipients.Any(r => r.UserId == userId));
            }

            // فقط پیام‌هایی که برای این کاربر مخفی نشده‌اند
            query = query.Where(m => !m.Recipients.Any(r => r.UserId == userId && r.IsHidden));

            var messages = await query
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var messagesDto = messages.Select(m => new
            {
                m.Id,
                m.SenderId,
                SenderName = m.Sender.UserName,
                ReceiverIds = m.Recipients.Select(r => r.UserId),
                ReceiverNames = m.Recipients.Select(r => r.User.UserName),
                m.Content,
                m.CreatedAt,
                m.ConversationId,
                IsReadByCurrentUser = m.Recipients
                    .Where(r => r.UserId == userId)
                    .Select(r => r.IsRead)
                    .FirstOrDefault(),
                IsHiddenByCurrentUser = m.Recipients
                    .Where(r => r.UserId == userId)
                    .Select(r => r.IsHidden)
                    .FirstOrDefault()
            });

            return Ok(messagesDto);
        }

        // =============================
        // 2. ارسال پیام
        // =============================
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] CreateChatMessageDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Content) || dto.ReceiverIds == null || !dto.ReceiverIds.Any())
                return BadRequest("متن پیام و گیرنده‌ها نمی‌توانند خالی باشند.");

            var sender = await _context.Users.FindAsync(dto.SenderId);
            if (sender == null)
                return BadRequest("کاربر فرستنده معتبر نیست.");

            var receivers = await _context.Users
                .Where(u => dto.ReceiverIds.Contains(u.Id))
                .ToListAsync();

            if (!receivers.Any())
                return BadRequest("گیرنده‌ها معتبر نیستند.");

            // بررسی و ایجاد مکالمه
            ChatConversation conversation = null;
            if (dto.ConversationId > 0)
            {
                conversation = await _context.ChatConversations
                    .Include(c => c.Participants)
                    .FirstOrDefaultAsync(c => c.Id == dto.ConversationId);
            }

            if (conversation == null)
            {
                conversation = new ChatConversation
                {
                    Name = "گفتگوی جدید"
                };

                _context.ChatConversations.Add(conversation);
                await _context.SaveChangesAsync();

                var participants = receivers.Select(r => new ChatConversationParticipant
                {
                    ConversationId = conversation.Id,
                    UserId = r.Id
                }).ToList();

                participants.Add(new ChatConversationParticipant
                {
                    ConversationId = conversation.Id,
                    UserId = sender.Id
                });

                _context.ChatConversationParticipants.AddRange(participants);
                await _context.SaveChangesAsync();
            }

            // اضافه کردن گیرندگان + فرستنده
            var allRecipients = new List<Guid>(dto.ReceiverIds);
            allRecipients.Add(dto.SenderId);

            var message = new ChatMessage
            {
                SenderId = sender.Id,
                Content = dto.Content,
                ConversationId = conversation.Id,
                CreatedAt = DateTime.UtcNow,
                Recipients = allRecipients.Distinct().Select(uid => new ChatMessageRecipient
                {
                    UserId = uid,
                    IsRead = uid == dto.SenderId, // فرستنده خودش پیام را خوانده
                    IsHidden = false
                }).ToList()
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // بارگذاری اطلاعات برای خروجی
            await _context.Entry(message).Reference(m => m.Sender).LoadAsync();
            await _context.Entry(message).Collection(m => m.Recipients).Query().Include(r => r.User).LoadAsync();

            return Ok(new
            {
                message.Id,
                message.SenderId,
                SenderName = message.Sender.UserName,
                ReceiverIds = message.Recipients.Select(r => r.UserId),
                ReceiverNames = message.Recipients.Select(r => r.User.UserName),
                message.Content,
                message.CreatedAt,
                message.ConversationId
            });
        }

        // =============================
        // 3. تعداد پیام‌های خوانده نشده
        // =============================
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadMessagesCount()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("کاربر احراز هویت نشده است.");

            var userId = Guid.Parse(userIdClaim);

            var count = await _context.ChatMessageRecipients
                .Where(r => r.UserId == userId && !r.IsRead && !r.IsHidden)
                .CountAsync();

            return Ok(new { unreadCount = count });
        }

        // =============================
        // 4. علامت‌گذاری پیام به عنوان خوانده شده
        // =============================
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("کاربر احراز هویت نشده است.");

            var userId = Guid.Parse(userIdClaim);

            var recipient = await _context.ChatMessageRecipients
                .FirstOrDefaultAsync(r => r.ChatMessageId == id && r.UserId == userId);

            if (recipient == null)
                return NotFound("پیام یافت نشد یا شما مجاز به خواندن آن نیستید.");

            recipient.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                ChatMessageId = recipient.ChatMessageId,
                recipient.IsRead
            });
        }

        // =============================
        // 5. مخفی کردن پیام برای کاربر فعلی
        // =============================
        [HttpPut("{id}/hide")]
        public async Task<IActionResult> HideMessage(int id)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized("کاربر احراز هویت نشده است.");

            var userId = Guid.Parse(userIdClaim);

            var recipient = await _context.ChatMessageRecipients
                .FirstOrDefaultAsync(r => r.ChatMessageId == id && r.UserId == userId);

            if (recipient == null)
            {
                recipient = new ChatMessageRecipient
                {
                    ChatMessageId = id,
                    UserId = userId,
                    IsRead = false,
                    IsHidden = true
                };
                _context.ChatMessageRecipients.Add(recipient);
            }
            else
            {
                recipient.IsHidden = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                ChatMessageId = id,
                recipient.IsHidden
            });
        }
    }
}
