using Microsoft.AspNetCore.Mvc;
using CRMApp.Models;
using CRMApp.Data;
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

        // ====================== ارجاع مشتری با تمام تعامل‌ها ======================
        [HttpPost("by-customer")]
        public async Task<IActionResult> CreateReferralByCustomer(
            [FromBody] CustomerReferralDto dto)
        {
            var userId = User.GetUserId();
            if (userId == Guid.Empty)
                return Unauthorized("کاربر لاگین نیست");

            // 1️⃣ غیرفعال‌کردن ارجاع‌های قبلی این مشتری
            var oldReferrals = await _context.CustomerInteractionReferrals
                .Where(r =>
                    r.CustomerId == dto.CustomerId &&
                    r.IsIndividual == dto.IsIndividual &&
                    r.IsActive)
                .ToListAsync();

            foreach (var r in oldReferrals)
                r.IsActive = false;

            // 2️⃣ ایجاد فقط یک ارجاع جدید
            var referral = new CustomerInteractionReferral
            {
                CustomerId = dto.CustomerId,
                IsIndividual = dto.IsIndividual,
                AssignedToId = dto.AssignedToId,
                ReferredById = userId,
                Note = dto.Note,
                IsActive = true,
                IsRead = false
            };

            _context.CustomerInteractionReferrals.Add(referral);

            // 3️⃣ تغییر مالک تمام تعامل‌های فعال مشتری
            var interactions = await _context.CustomerInteractions
                .Where(i => i.IsActive &&
                    (dto.IsIndividual
                        ? i.IndividualCustomerId == dto.CustomerId
                        : i.CompanyCustomerId == dto.CustomerId))
                .ToListAsync();

            foreach (var interaction in interactions)
                interaction.CurrentOwnerId = dto.AssignedToId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "مشتری با تمام تعامل‌هایش با موفقیت ارجاع شد",
                interactionsCount = interactions.Count
            });
        }

        // ====================== تاریخچه ارجاعات ======================
        [HttpGet("referral-history")]
        public async Task<IActionResult> GetAllReferralHistory()
        {
            var referrals = await _context.CustomerInteractionReferrals
                .Include(r => r.AssignedTo)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .Include(r => r.ReferredBy)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .OrderByDescending(r => r.ReferredAt)
                .Select(r => new
                {
                    r.Id,
                    r.CustomerId,
                    r.IsIndividual,
                    r.Note,
                    r.ReferredAt,
                    r.IsRead,
                    r.IsActive,

                    AssignedToName = r.AssignedTo != null ? r.AssignedTo.FullName : "-",
                    ReferredByName = r.ReferredBy != null ? r.ReferredBy.FullName : "-",

                    AssignedToRole = r.AssignedTo != null
                        ? r.AssignedTo.UserRoles
                            .Select(ur => ur.Role.Name)
                            .FirstOrDefault()
                        : "-",

                    ReferredByRole = r.ReferredBy != null
                        ? r.ReferredBy.UserRoles
                            .Select(ur => ur.Role.Name)
                            .FirstOrDefault()
                        : "-",

                    CustomerName = r.IsIndividual
                        ? _context.CustomerIndividuals
                            .Where(c => c.CustomerId == r.CustomerId)
                            .Select(c => c.FullName)
                            .FirstOrDefault()
                        : _context.CustomerCompanies
                            .Where(c => c.CustomerId == r.CustomerId)
                            .Select(c => c.CompanyName)
                            .FirstOrDefault(),

                    CustomerType = r.IsIndividual ? "Individual" : "Company"
                })
                .ToListAsync();

            return Ok(referrals);
        }

        [HttpGet("my-referrals")]
        public async Task<IActionResult> GetReferralsByUser()
        {
            var userId = User.GetUserId();

            var referrals = await _context.CustomerInteractionReferrals
                .Where(r => r.AssignedToId == userId)
                .Include(r => r.AssignedTo)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .Include(r => r.ReferredBy)
                    .ThenInclude(u => u.UserRoles)
                        .ThenInclude(ur => ur.Role)
                .OrderByDescending(r => r.ReferredAt)
                .Select(r => new
                {
                    r.Id,
                    r.CustomerId,
                    r.IsIndividual,
                    r.Note,
                    r.ReferredAt,
                    r.IsRead,
                    r.IsActive,

                    r.AssignedToId,
                    r.ReferredById,

                    AssignedToName = r.AssignedTo != null ? r.AssignedTo.FullName : "-",
                    ReferredByName = r.ReferredBy != null ? r.ReferredBy.FullName : "-",

                    AssignedToRole = r.AssignedTo != null
                        ? r.AssignedTo.UserRoles
                            .Select(ur => ur.Role.Name)
                            .FirstOrDefault()
                        : "-",

                    ReferredByRole = r.ReferredBy != null
                        ? r.ReferredBy.UserRoles
                            .Select(ur => ur.Role.Name)
                            .FirstOrDefault()
                        : "-",

                    CustomerName = r.IsIndividual
                        ? _context.CustomerIndividuals
                            .Where(c => c.CustomerId == r.CustomerId)
                            .Select(c => c.FullName)
                            .FirstOrDefault()
                        : _context.CustomerCompanies
                            .Where(c => c.CustomerId == r.CustomerId)
                            .Select(c => c.CompanyName)
                            .FirstOrDefault(),

                    CustomerType = r.IsIndividual ? "Individual" : "Company"
                })
                .ToListAsync();

            return Ok(referrals);
        }




        // ====================== علامت‌گذاری خوانده‌شده ======================
        [HttpPost("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var referral = await _context.CustomerInteractionReferrals.FindAsync(id);
            if (referral == null)
                return NotFound("ارجاع یافت نشد");

            var userId = User.GetUserId();
            if (referral.AssignedToId != userId)
                return Forbid();

            referral.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // ====================== DTO ======================
        public class CustomerReferralDto
        {
            public int CustomerId { get; set; }
            public bool IsIndividual { get; set; }
            public Guid AssignedToId { get; set; }
            public string? Note { get; set; }
        }
    }
}
