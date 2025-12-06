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

            var interaction = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Referrals)
                .FirstOrDefaultAsync(i => i.Id == dto.InteractionId);

            if (interaction == null)
                return BadRequest("InteractionId نامعتبر است.");

            var assignedUser = await _context.Users.FindAsync(dto.AssignedToId);
            if (assignedUser == null)
                return BadRequest("کاربر انتخابی وجود ندارد.");

            // ایجاد ارجاع
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

            // بروزرسانی مالک تعامل به کاربر جدید
            interaction.CurrentOwnerId = dto.AssignedToId;
            interaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(referral);
        }





        [HttpGet("user/{userId}")]
    public IActionResult GetUserReferrals(string userId)
    {
        var referrals = _context.CustomerInteractionReferrals
            .Where(r => r.AssignedToId.ToString() == userId && r.IsActive)
            .Include(r => r.Interaction)
                .ThenInclude(i => i.IndividualCustomer)
            .Include(r => r.Interaction)
                .ThenInclude(i => i.CompanyCustomer)
            .Include(r => r.ReferredBy)
            .Select(r => new
            {
                r.Id,
                r.InteractionId,
                r.Note,
                r.ReferredAt,
                r.IsRead,
                ReferredByName = r.ReferredBy.FullName,
                CustomerName = r.Interaction.IndividualCustomer != null
                               ? r.Interaction.IndividualCustomer.FullName
                               : r.Interaction.CompanyCustomer != null
                                 ? r.Interaction.CompanyCustomer.CompanyName
                                 : null
            })
            .ToList();

        return Ok(referrals);
    }

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



        // DTO برای ارسال داده از فرانت
        public class ReferralCreateDto
        {
            public int InteractionId { get; set; }
            public Guid AssignedToId { get; set; }
            public string? Note { get; set; }
        }
    }

    // اکستنشن برای گرفتن UserId از JWT
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return idClaim != null ? Guid.Parse(idClaim) : Guid.Empty;
        }
    }


}
