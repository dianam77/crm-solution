using Microsoft.AspNetCore.Mvc;
using CRMApp.Models;
using CRMApp.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerReferralController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public CustomerReferralController(CRMAppDbContext context)
        {
            _context = context;
        }

        // ===================== ارجاع مشتری =====================
        [HttpPost]
        public async Task<IActionResult> ReferCustomer([FromBody] CustomerReferralCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized("کاربر احراز هویت نشده است.");

            if (dto.IndividualCustomerId == null && dto.CompanyCustomerId == null)
                return BadRequest("مشتری مشخص نشده است.");

            var assignedUser = await _context.Users.FindAsync(dto.AssignedToId);
            if (assignedUser == null)
                return BadRequest("کاربر گیرنده وجود ندارد.");

            // ===================== همه تعامل‌های مشتری =====================
            var interactions = await _context.CustomerInteractions
                .Where(i =>
                    (dto.IndividualCustomerId != null && i.IndividualCustomerId == dto.IndividualCustomerId) ||
                    (dto.CompanyCustomerId != null && i.CompanyCustomerId == dto.CompanyCustomerId)
                )
                .ToListAsync();

            if (!interactions.Any())
                return BadRequest("هیچ تعاملی برای این مشتری وجود ندارد.");

            // ===================== غیرفعال‌کردن ارجاعات قبلی =====================
            var oldReferrals = await _context.CustomerInteractionReferrals
                .Where(r =>
                    r.IsActive &&
                    ((dto.IndividualCustomerId != null && r.IsIndividual && r.CustomerId == dto.IndividualCustomerId) ||
                     (dto.CompanyCustomerId != null && !r.IsIndividual && r.CustomerId == dto.CompanyCustomerId))
                )
                .ToListAsync();

            foreach (var r in oldReferrals)
                r.IsActive = false;

            // ===================== ایجاد ارجاع جدید =====================
            var newReferral = new CustomerInteractionReferral
            {
                CustomerId = dto.IndividualCustomerId ?? dto.CompanyCustomerId!.Value,
                IsIndividual = dto.IndividualCustomerId != null,
                AssignedToId = dto.AssignedToId,
                ReferredById = userId,
                Note = dto.Note,
                IsActive = true,
                IsRead = false
            };

            _context.CustomerInteractionReferrals.Add(newReferral);

            // ===================== تغییر مالک تعامل‌ها =====================
            foreach (var interaction in interactions)
            {
                interaction.CurrentOwnerId = dto.AssignedToId;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "مشتری با موفقیت ارجاع شد و همه تعامل‌ها منتقل شدند",
                transferredInteractions = interactions.Count,
                assignedTo = assignedUser.FullName
            });
        }

        // ===================== تاریخچه ارجاعات =====================
        [HttpGet("history")]
        public async Task<IActionResult> GetReferralHistory()
        {
            var history = await _context.CustomerInteractionReferrals
                .Include(r => r.AssignedTo)
                .Include(r => r.ReferredBy)
                .OrderByDescending(r => r.ReferredAt)
                .Select(r => new
                {
                    r.Id,
                    r.CustomerId,
                    r.IsIndividual,
                    r.ReferredAt,
                    r.IsRead,
                    r.IsActive,
                    AssignedTo = r.AssignedTo!.FullName,
                    ReferredBy = r.ReferredBy!.FullName,
                    r.Note
                })
                .ToListAsync();

            return Ok(history);
        }

        // ===================== علامت‌گذاری به عنوان خوانده شده =====================
        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var referral = await _context.CustomerInteractionReferrals.FindAsync(id);
            if (referral == null)
                return NotFound();

            var userId = User.GetUserId();
            if (referral.AssignedToId != userId)
                return Forbid();

            referral.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok();
        }
    }

    // ===================== DTO =====================
    public class CustomerReferralCreateDto
    {
        public int? IndividualCustomerId { get; set; }
        public int? CompanyCustomerId { get; set; }
        public Guid AssignedToId { get; set; }
        public string? Note { get; set; }
    }

    // ===================== EXTENSION =====================
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return id != null ? Guid.Parse(id) : Guid.Empty;
        }
    }
}
