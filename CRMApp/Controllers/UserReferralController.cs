using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using CRMApp.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserReferralController : ControllerBase
    {
        private readonly CRMAppDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserReferralController(CRMAppDbContext dbContext, UserManager<ApplicationUser> userManager)
        {
            _dbContext = dbContext;
            _userManager = userManager;
        }

        // GET: api/UserReferral
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");

            List<UserReferral> referrals;

            if (isAdmin)
            {
                // Admin همه ارجاعات را می‌بیند
                referrals = await _dbContext.UserReferrals
                    .Include(r => r.AssignedBy)
                    .Include(r => r.AssignedTo)
                    .ToListAsync();
            }
            else
            {
                // کاربر معمولی ارجاعات فرستاده یا دریافت‌شده خودش را می‌بیند
                referrals = await _dbContext.UserReferrals
                    .Include(r => r.AssignedBy)
                    .Include(r => r.AssignedTo)
                    .Where(r => r.AssignedToId.ToString() == userId || r.AssignedById.ToString() == userId)
                    .ToListAsync();
            }

            return Ok(referrals);
        }

        // GET: api/UserReferral/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var referral = await _dbContext.UserReferrals
                .Include(r => r.AssignedBy)
                .Include(r => r.AssignedTo)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (referral == null) return NotFound("ارجاع یافت نشد");

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!User.IsInRole("Admin") && referral.AssignedToId.ToString() != userId && referral.AssignedById.ToString() != userId)
                return Forbid("شما اجازه مشاهده این ارجاع را ندارید");

            return Ok(referral);
        }

        // POST: api/UserReferral
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserReferralDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!Guid.TryParse(dto.AssignedById, out Guid assignedById))
                return BadRequest("شناسه ارجاع دهنده نامعتبر است");

            if (!Guid.TryParse(dto.AssignedToId, out Guid assignedToId))
                return BadRequest("شناسه گیرنده نامعتبر است");

            var assignedBy = await _userManager.FindByIdAsync(dto.AssignedById);
            var assignedTo = await _userManager.FindByIdAsync(dto.AssignedToId);

            if (assignedBy == null)
                return BadRequest($"کاربر ارجاع دهنده با شناسه {dto.AssignedById} در سیستم ثبت نشده است");

            if (assignedTo == null)
                return BadRequest($"کاربر گیرنده با شناسه {dto.AssignedToId} معتبر نیست");

            var referral = new UserReferral
            {
                AssignedById = assignedById,
                AssignedToId = assignedToId,
                Notes = dto.Notes,
                Status = ReferralStatus.Pending,
                Priority = dto.Priority
            };

            _dbContext.UserReferrals.Add(referral);
            await _dbContext.SaveChangesAsync();

            return Ok(referral);
        }

        // PUT: api/UserReferral/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // فقط ادمین می‌تواند ویرایش کند
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserReferralDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var referral = await _dbContext.UserReferrals.FindAsync(id);
            if (referral == null)
                return NotFound("ارجاع یافت نشد");

            if (!Guid.TryParse(dto.AssignedToId, out Guid assignedToGuid))
                return BadRequest("شناسه ارجاع گیرنده نامعتبر است");

            var assignedTo = await _userManager.FindByIdAsync(dto.AssignedToId);
            if (assignedTo == null)
                return BadRequest($"کاربر گیرنده با شناسه {dto.AssignedToId} یافت نشد");

            referral.AssignedToId = assignedToGuid;
            referral.Notes = dto.Notes;
            referral.Priority = dto.Priority;
            referral.Status = dto.Status;

            _dbContext.UserReferrals.Update(referral);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "ارجاع با موفقیت ویرایش شد", referral });
        }

        // PUT: api/UserReferral/{id}/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,User")] // Admin یا User می‌توانند وضعیت را تغییر دهند
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var referral = await _dbContext.UserReferrals.FindAsync(id);
            if (referral == null) return NotFound("ارجاع یافت نشد");

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // کاربر معمولی فقط می‌تواند وضعیت ارجاع خودش را تغییر دهد
            if (!User.IsInRole("Admin") && referral.AssignedToId.ToString() != userId && referral.AssignedById.ToString() != userId)
                return Forbid("شما اجازه تغییر وضعیت این ارجاع را ندارید");

            referral.Status = dto.Status;
            _dbContext.UserReferrals.Update(referral);
            await _dbContext.SaveChangesAsync();

            return Ok(referral);
        }

        public class UpdateStatusDto
        {
            public ReferralStatus Status { get; set; }
        }

        // DELETE: api/UserReferral/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var referral = await _dbContext.UserReferrals.FindAsync(id);
            if (referral == null)
                return NotFound(new { message = "ارجاع یافت نشد" });

            _dbContext.UserReferrals.Remove(referral);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "ارجاع حذف شد" });
        }
    }
}
