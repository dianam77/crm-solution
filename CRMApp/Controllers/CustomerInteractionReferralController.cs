using Microsoft.AspNetCore.Mvc;
using CRMApp.Models;
using CRMApp.Data;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerInteractionReferralController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public CustomerInteractionReferralController(CRMAppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReferral([FromBody] ReferralCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized("کاربر احراز هویت نشده است.");

            // 1️⃣ پیدا کردن تعامل
            var interaction = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.CurrentOwner)
                .FirstOrDefaultAsync(i => i.Id == dto.InteractionId);

            if (interaction == null)
                return BadRequest("InteractionId نامعتبر است.");

            var assignedUser = await _context.Users.FindAsync(dto.AssignedToId);
            if (assignedUser == null)
                return BadRequest("کاربر انتخابی وجود ندارد.");

            // 2️⃣ غیرفعال کردن تعاملات فعال همان مشتری (غیر از تعامل جاری)
            var activeInteractionsSameCustomer = await _context.CustomerInteractions
                .Where(i =>
                    i.Id != interaction.Id &&
                    i.IsActive &&
                    (
                        (interaction.IndividualCustomerId != null && i.IndividualCustomerId == interaction.IndividualCustomerId) ||
                        (interaction.CompanyCustomerId != null && i.CompanyCustomerId == interaction.CompanyCustomerId)
                    )
                )
                .ToListAsync();

            foreach (var item in activeInteractionsSameCustomer)
            {
                item.IsActive = false;
            }

            // تعامل فعلی همیشه فعال می‌ماند
            interaction.IsActive = true;

            // 3️⃣ غیرفعال کردن ارجاعات قبلی همین تعامل
            var previousReferrals = await _context.CustomerInteractionReferrals
                .Where(r => r.InteractionId == interaction.Id && r.IsActive)
                .ToListAsync();

            foreach (var r in previousReferrals)
            {
                r.IsActive = false;
            }

            // 4️⃣ تغییر مالک تعامل فعلی و ذخیره فوری
            interaction.CurrentOwnerId = dto.AssignedToId;
            await _context.SaveChangesAsync(); // ⚠️ ذخیره قبل از بررسی پیام

            // 5️⃣ بررسی پیام ⚠️ برای تعامل‌های فعال دیگر با همان مشتری و مالک متفاوت
            var otherOwnerInteractions = await _context.CustomerInteractions
                .Where(i =>
                    i.IsActive &&
                    i.Id != interaction.Id &&
                    (
                        (interaction.IndividualCustomerId != null && i.IndividualCustomerId == interaction.IndividualCustomerId) ||
                        (interaction.CompanyCustomerId != null && i.CompanyCustomerId == interaction.CompanyCustomerId)
                    ) &&
                    i.CurrentOwnerId != interaction.CurrentOwnerId // مالک جدید
                )
                .Include(i => i.CurrentOwner)
                .ToListAsync();

            if (otherOwnerInteractions.Any())
            {
                var ownerNames = otherOwnerInteractions
                    .Select(i => i.CurrentOwner.FullName ?? i.CurrentOwnerId.ToString());

                return BadRequest($"⚠️ مشتری «{(interaction.IndividualCustomerId != null ? "فردی" : "شرکتی")}» در حال حاضر توسط کاربر «{string.Join(", ", ownerNames)}» در تعامل فعال قرار دارد.");
            }

            // 6️⃣ ایجاد ارجاع جدید
            var referral = new CustomerInteractionReferral
            {
                InteractionId = dto.InteractionId,
                AssignedToId = dto.AssignedToId,
                ReferredById = userId,
                Note = dto.Note,
                ReferredAt = DateTime.UtcNow,
                IsActive = true,
                IsRead = false
            };
            _context.CustomerInteractionReferrals.Add(referral);

            await _context.SaveChangesAsync();
            return Ok(referral);
        }


        [HttpGet("referral-history")]
        public async Task<IActionResult> GetAllReferralHistory()
        {
            var referrals = await _context.CustomerInteractionReferrals
                .Include(r => r.AssignedTo)
                .Include(r => r.ReferredBy)
                .Include(r => r.Interaction) // اضافه کردن تعامل برای دسترسی به InteractionType
                .OrderByDescending(r => r.ReferredAt)
                .Select(r => new
                {
                    r.Id,
                    r.InteractionId,
                    InteractionType = r.Interaction != null ? (int?)r.Interaction.InteractionType : null, // تبدیل صریح enum به int?
                    r.Note,
                    r.ReferredAt,
                    r.IsRead,
                    r.IsActive,
                    AssignedToName = r.AssignedTo != null ? r.AssignedTo.FullName : null,
                    ReferredByName = r.ReferredBy != null ? r.ReferredBy.FullName : null
                })
                .ToListAsync();

            return Ok(referrals);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserReferrals(string userId)
        {
            var userGuid = Guid.Parse(userId);

            var referrals = await _context.CustomerInteractionReferrals
                .Where(r => r.AssignedToId == userGuid)
                .Include(r => r.AssignedTo)
                .Include(r => r.ReferredBy)
                .Include(r => r.Interaction) // اضافه کردن تعامل برای دسترسی به InteractionType
                .OrderByDescending(r => r.ReferredAt)
                .Select(r => new
                {
                    r.Id,
                    r.InteractionId,
                    InteractionType = r.Interaction != null ? (int?)r.Interaction.InteractionType : null, // تبدیل صریح enum به int?
                    r.Note,
                    r.ReferredAt,
                    r.IsRead,
                    r.IsActive,
                    AssignedToName = r.AssignedTo != null ? r.AssignedTo.FullName : null,
                    ReferredByName = r.ReferredBy != null ? r.ReferredBy.FullName : null
                })
                .ToListAsync();

            return Ok(referrals);
        }


        // ----------------- Mark As Read ----------------------
        [HttpPost("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var referral = await _context.CustomerInteractionReferrals.FindAsync(id);
            if (referral == null)
                return NotFound("ارجاع یافت نشد.");

            var userId = User.GetUserId();
            if (referral.AssignedToId != userId)
                return Forbid();

            referral.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok();
        }

        // ----------------- DTO ----------------------
        public class ReferralCreateDto
        {
            public int InteractionId { get; set; }
            public Guid AssignedToId { get; set; }
            public string? Note { get; set; }
        }
    }

    // ----------------- Extension for UserId ----------------------
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }
    }
}
