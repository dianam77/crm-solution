using CRMApp.Data;
using CRMApp.Models;
using CRMApp.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager,User")]
    public class CustomerInteractionController : ControllerBase
    {
        private readonly CRMAppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CustomerInteractionController(CRMAppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private string GetRootPath() =>
            _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        private bool IsValidFile(IFormFile file)
        {
            var allowedExtensions = new[]
            {
                ".xlsx", ".xls", ".zip", ".pdf", ".txt", ".csv", ".docx",
                ".jpg", ".jpeg", ".png"
            };

            var allowedContentTypes = new[]
            {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/zip",
                "application/pdf",
                "text/plain",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/jpeg",
                "image/png"
            };

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return allowedExtensions.Contains(extension) && allowedContentTypes.Contains(file.ContentType);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var interactions = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Attachments)
                .OrderByDescending(i => i.StartDateTime)
                .ToListAsync();

            return Ok(interactions ?? new List<CustomerInteraction>());
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var interaction = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null)
                return NotFound();

            return Ok(interaction);
        }

        [HttpPost]
        [RequestSizeLimit(50_000_000)] // 50 MB
        public async Task<IActionResult> Create([FromForm] CustomerInteractionUpdateDto dto, [FromForm] List<IFormFile>? attachments)
        {
            var interaction = new CustomerInteraction
            {
                IndividualCustomerId = dto.IndividualCustomerId.HasValue ? (int?)dto.IndividualCustomerId.Value : null,
                CompanyCustomerId = dto.CompanyCustomerId.HasValue ? (int?)dto.CompanyCustomerId.Value : null,
                InteractionType = (InteractionTypeEnum)dto.InteractionType,
                StartDateTime = dto.StartDateTime,
                EndDateTime = dto.EndDateTime,
                DurationMinutes = dto.DurationMinutes,
                Subject = dto.Subject,
                Notes = dto.Notes,
                PerformedBy = User.Identity?.Name
            };

            var uploadPath = Path.Combine(GetRootPath(), "uploads");
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            // ذخیره فایل‌های جدید
            if (attachments != null)
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file))
                        return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");

                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadPath, fileName);

                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);

                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = $"/uploads/{fileName}"
                    });
                }
            }

            // اضافه کردن فایل‌های موجود قبلی
            if (!string.IsNullOrEmpty(dto.ExistingAttachmentPaths))
            {
                foreach (var path in dto.ExistingAttachmentPaths.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = path.Trim()
                    });
                }
            }

            _context.CustomerInteractions.Add(interaction);
            await _context.SaveChangesAsync();

            return Ok(interaction);
        }

        [HttpPut("{id:int}")]
        [RequestSizeLimit(50_000_000)] // 50 MB
        public async Task<IActionResult> Update(int id, [FromForm] CustomerInteractionUpdateDto dto, [FromForm] List<IFormFile>? attachments)
        {
            var interaction = await _context.CustomerInteractions
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null)
                return NotFound();

            interaction.IndividualCustomerId = dto.IndividualCustomerId.HasValue ? (int?)dto.IndividualCustomerId.Value : null;
            interaction.CompanyCustomerId = dto.CompanyCustomerId.HasValue ? (int?)dto.CompanyCustomerId.Value : null;
            interaction.InteractionType = (InteractionTypeEnum)dto.InteractionType;
            interaction.StartDateTime = dto.StartDateTime;
            interaction.EndDateTime = dto.EndDateTime;
            interaction.DurationMinutes = dto.DurationMinutes;
            interaction.Subject = dto.Subject;
            interaction.Notes = dto.Notes;
            interaction.UpdatedAt = DateTime.UtcNow;

            interaction.Attachments ??= new List<CustomerInteractionAttachment>();
            var uploadPath = Path.Combine(GetRootPath(), "uploads");
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            // فایل‌هایی که باقی می‌مانند
            var existingFiles = dto.ExistingAttachmentPaths?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.Trim()).ToList() ?? new List<string>();

            // حذف فایل‌های قدیمی که باقی نمی‌مانند
            var toRemove = interaction.Attachments.Where(a => !existingFiles.Contains(a.FilePath)).ToList();
            foreach (var rem in toRemove)
            {
                var fullPath = Path.Combine(GetRootPath(), rem.FilePath.TrimStart('/'));
                try
                {
                    if (System.IO.File.Exists(fullPath))
                        System.IO.File.Delete(fullPath);
                }
                catch (Exception ex)
                {
                    return BadRequest($"خطا در حذف فایل: {ex.Message}");
                }

                _context.CustomerInteractionAttachments.Remove(rem);
            }

            // اضافه کردن فایل‌های جدید
            if (attachments != null && attachments.Any())
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file))
                        return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");

                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadPath, fileName);

                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);

                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = $"/uploads/{fileName}",
                        CustomerInteraction = interaction
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(interaction);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var interaction = await _context.CustomerInteractions
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null)
                return NotFound();

            // حذف فایل‌های فیزیکی
            foreach (var att in interaction.Attachments)
            {
                var fullPath = Path.Combine(GetRootPath(), att.FilePath.TrimStart('/'));
                try
                {
                    if (System.IO.File.Exists(fullPath))
                        System.IO.File.Delete(fullPath);
                }
                catch (Exception ex)
                {
                    return BadRequest($"خطا در حذف فایل {att.FilePath}: {ex.Message}");
                }
            }

            _context.CustomerInteractions.Remove(interaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
