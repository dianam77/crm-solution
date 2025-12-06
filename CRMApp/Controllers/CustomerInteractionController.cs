using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Security.Claims;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerInteractionController : ControllerBase
    {
        private readonly CRMAppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CustomerInteractionController(CRMAppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private string GetRootPath() => _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        private bool IsValidFile(IFormFile file)
        {
            var allowedExtensions = new[] { ".xlsx", ".xls", ".zip", ".pdf", ".txt", ".csv", ".docx", ".jpg", ".jpeg", ".png" };
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
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            return allowedExtensions.Contains(ext) && allowedContentTypes.Contains(file.ContentType);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var interactions = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Attachments)
                .Include(i => i.InteractionCategories)
                .Include(i => i.InteractionProducts)
                .Include(i => i.CreatedBy)
                .Include(i => i.CurrentOwner)
                .Include(i => i.PerformedBy)
                .OrderByDescending(i => i.StartDateTime)
                .ToListAsync();

            var interactionsDto = interactions.Select(i => new
            {
                i.Id,
                i.Subject,
                i.Notes,
                i.StartDateTime,
                i.EndDateTime,
                i.DurationMinutes,
                InteractionType = (int)i.InteractionType,
                InteractionTypeLabel = i.InteractionType.ToString(),
                IsActive = i.IsActive,

                IndividualCustomerId = i.IndividualCustomerId,
                CompanyCustomerId = i.CompanyCustomerId,

                CustomerFullName = i.IndividualCustomer != null
                    ? i.IndividualCustomer.FullName
                    : i.CompanyCustomer?.CompanyName ?? "-",

                Attachments = i.Attachments.Select(a => new
                {
                    a.FilePath,
                    a.OriginalName
                }).ToList(),

                CategoryIds = i.InteractionCategories.Select(ic => ic.CategoryId).ToList(),
                ProductIds = i.InteractionProducts.Select(ip => ip.ProductId).ToList(),

                CreatedByName = i.CreatedBy?.FullName ?? "-",
                CurrentOwnerName = i.CurrentOwner?.FullName ?? "-",
                PerformedByName = i.PerformedBy?.FullName ?? "-"
            }).ToList();

            return Ok(interactionsDto);
        }

        [HttpGet("active-by-customer/{customerId:int}")]
        public async Task<IActionResult> GetActiveInteractionByCustomer(int customerId)
        {
            var userIdString = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var currentUserId))
                return Unauthorized();

            // دریافت همه تعاملات فعال همان مشتری
            var activeInteractions = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.CurrentOwner)
                .Where(i =>
                    (i.IndividualCustomerId == customerId || i.CompanyCustomerId == customerId) &&
                    i.IsActive
                )
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            // فقط تعاملاتی که مالک آنها کاربر جاری نیست
            var conflictingInteractions = activeInteractions
                .Where(i => i.CurrentOwnerId != currentUserId)
                .Select(i => new
                {
                    i.Id,
                    CustomerFullName = i.IndividualCustomer != null
                        ? i.IndividualCustomer.FullName
                        : i.CompanyCustomer?.CompanyName,
                    CurrentOwnerFullName = i.CurrentOwner != null
                        ? i.CurrentOwner.FirstName + " " + i.CurrentOwner.LastName
                        : null,
                    i.CurrentOwnerId
                })
                .ToList();

            if (!conflictingInteractions.Any())
                return Ok(new { Conflict = false });

            return Ok(new
            {
                Conflict = true,
                ConflictingInteractions = conflictingInteractions
            });
        }





        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = User.GetUserId();

            var interaction = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Attachments)
                .Include(i => i.InteractionCategories).ThenInclude(ic => ic.Category)
                .Include(i => i.InteractionProducts).ThenInclude(ip => ip.Product)
                .Include(i => i.CreatedBy)
                .Include(i => i.CurrentOwner)
                .Include(i => i.PerformedBy)
                .Include(i => i.Referrals)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null) return NotFound();

            // فقط مالک یا گیرنده ارجاع می‌تواند مشاهده کند
            if (interaction.CurrentOwnerId != userId &&
                !interaction.Referrals.Any(r => r.AssignedToId == userId && r.IsActive))
                return Forbid();

            var dto = new
            {
                interaction.Id,
                interaction.Subject,
                interaction.Notes,
                interaction.StartDateTime,
                interaction.EndDateTime,
                interaction.DurationMinutes,
                InteractionType = (int)interaction.InteractionType,
                InteractionTypeLabel = interaction.InteractionType.ToString(),
                IsActive = interaction.IsActive,

                interaction.IndividualCustomerId,
                interaction.CompanyCustomerId,

                Attachments = interaction.Attachments.Select(a => new { a.FilePath, a.OriginalName }).ToList(),

                CategoryIds = interaction.InteractionCategories.Select(ic => ic.CategoryId).ToList(),
                ProductIds = interaction.InteractionProducts.Select(ip => ip.ProductId).ToList(),

                CreatedByName = interaction.CreatedBy?.FullName ?? "-",
                CurrentOwnerName = interaction.CurrentOwner?.FullName ?? "-",
                PerformedByName = interaction.PerformedBy?.FullName ?? "-",

                IsOwnedByCurrentUser = interaction.CurrentOwnerId == userId,
                IsReferredToUser = interaction.Referrals.Any(r => r.AssignedToId == userId && r.IsActive)
            };

            return Ok(dto);
        }



        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        [Authorize]
        public async Task<IActionResult> Create([FromForm] CustomerInteractionUpdateDto dto,
                                        [FromForm] List<IFormFile>? attachments)
        {
            var userIdString = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized("کاربر لاگین نکرده یا شناسه نامعتبر است.");

            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return BadRequest("کاربر لاگین کرده در سیستم ثبت نشده است.");

            var interaction = new CustomerInteraction
            {
                IndividualCustomerId = dto.IndividualCustomerId,
                CompanyCustomerId = dto.CompanyCustomerId,
                InteractionType = (InteractionTypeEnum)dto.InteractionType,
                StartDateTime = dto.StartDateTime,
                EndDateTime = dto.EndDateTime,
                DurationMinutes = dto.DurationMinutes,
                Subject = dto.Subject,
                Notes = dto.Notes,
                CreatedById = userId,
                CurrentOwnerId = userId,
                PerformedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true // ← فعال کردن تعامل جدید
            };

            // ذخیره فایل‌ها
            var uploads = Path.Combine(GetRootPath(), "uploads");
            if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

            if (attachments != null)
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file))
                        return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");

                    var name = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var path = Path.Combine(uploads, name);
                    using var stream = new FileStream(path, FileMode.Create);
                    await file.CopyToAsync(stream);

                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = "/uploads/" + name,
                        OriginalName = file.FileName
                    });
                }
            }

            _context.CustomerInteractions.Add(interaction);
            await _context.SaveChangesAsync();

            // دسته‌بندی‌ها و محصولات
            var groups = dto.GetCategoryProductGroups();
            foreach (var g in groups)
            {
                foreach (var cat in g.CategoryIds.Distinct())
                    if (Guid.TryParse(cat, out var id1))
                        interaction.InteractionCategories.Add(new CustomerInteractionCategory
                        {
                            CustomerInteractionId = interaction.Id,
                            CategoryId = id1
                        });

                foreach (var prod in g.ProductIds.Distinct())
                    if (Guid.TryParse(prod, out var id2))
                        interaction.InteractionProducts.Add(new CustomerInteractionProduct
                        {
                            CustomerInteractionId = interaction.Id,
                            ProductId = id2
                        });
            }

            await _context.SaveChangesAsync();
            return Ok(interaction);
        }




        [HttpPut("{id:int}")]
        [RequestSizeLimit(50_000_000)]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromForm] CustomerInteractionUpdateDto dto,
                                        [FromForm] List<IFormFile>? attachments)
        {
            var interaction = await _context.CustomerInteractions
                .Include(i => i.Attachments)
                .Include(i => i.InteractionCategories)
                .Include(i => i.InteractionProducts)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null) return NotFound();

            interaction.IndividualCustomerId = dto.IndividualCustomerId;
            interaction.CompanyCustomerId = dto.CompanyCustomerId;
            interaction.InteractionType = (InteractionTypeEnum)dto.InteractionType;
            interaction.StartDateTime = dto.StartDateTime;
            interaction.EndDateTime = dto.EndDateTime;
            interaction.DurationMinutes = dto.DurationMinutes;
            interaction.Subject = dto.Subject;
            interaction.Notes = dto.Notes;
            interaction.UpdatedAt = DateTime.UtcNow;

            var uploadPath = Path.Combine(GetRootPath(), "uploads");
            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

            // حذف فایل‌های حذف‌شده
            var existingFiles = dto.ExistingAttachmentPaths?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(x => x.Trim()).ToList() ?? new List<string>();

            var toRemove = interaction.Attachments.Where(a => !existingFiles.Contains(a.FilePath)).ToList();
            foreach (var rem in toRemove)
            {
                var fullPath = Path.Combine(GetRootPath(), rem.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                _context.CustomerInteractionAttachments.Remove(rem);
            }

            // اضافه کردن فایل جدید
            if (attachments != null)
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file)) return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");

                    var name = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var path = Path.Combine(uploadPath, name);
                    using var stream = new FileStream(path, FileMode.Create);
                    await file.CopyToAsync(stream);

                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = "/uploads/" + name,
                        OriginalName = file.FileName
                    });
                }
            }

            // دسته‌بندی‌ها و محصولات
            _context.CustomerInteractionCategories.RemoveRange(interaction.InteractionCategories);
            _context.CustomerInteractionProducts.RemoveRange(interaction.InteractionProducts);

            var groups = dto.GetCategoryProductGroups();
            foreach (var g in groups)
            {
                foreach (var cat in g.CategoryIds.Distinct())
                    if (Guid.TryParse(cat, out var id1))
                        interaction.InteractionCategories.Add(new CustomerInteractionCategory
                        {
                            CustomerInteractionId = interaction.Id,
                            CategoryId = id1
                        });

                foreach (var prod in g.ProductIds.Distinct())
                    if (Guid.TryParse(prod, out var id2))
                        interaction.InteractionProducts.Add(new CustomerInteractionProduct
                        {
                            CustomerInteractionId = interaction.Id,
                            ProductId = id2
                        });
            }

            await _context.SaveChangesAsync();
            return Ok(interaction);
        }



        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var interaction = await _context.CustomerInteractions
                .Include(i => i.Attachments)
                .Include(i => i.InteractionCategories)
                .Include(i => i.InteractionProducts)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null) return NotFound();

            foreach (var att in interaction.Attachments)
            {
                if (att.FilePath.Contains("..")) continue;
                var fullPath = Path.Combine(GetRootPath(), att.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
            }

            _context.CustomerInteractions.Remove(interaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        public class UpdateIsActiveDto
        {
            public bool IsActive { get; set; }
        }

        [HttpPut("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateIsActive(int id, [FromBody] UpdateIsActiveDto dto)
        {
            var interaction = await _context.CustomerInteractions.FirstOrDefaultAsync(i => i.Id == id);
            if (interaction == null)
                return NotFound(new { message = "Interaction not found." });

            // بررسی ۳ ماه
            var threeMonthsPassed = (DateTime.UtcNow - interaction.CreatedAt).TotalDays >= 90;

            // خواندن لیست permissions از JWT
            var permissionsClaim = User.Claims.FirstOrDefault(c => c.Type == "permissions")?.Value;
            List<string> permissions = new List<string>();
            if (!string.IsNullOrEmpty(permissionsClaim))
                permissions = System.Text.Json.JsonSerializer.Deserialize<List<string>>(permissionsClaim);

            var canForceUpdate = permissions.Any(p =>
                p.Equals("CustomerInteraction.UpdateIsActive", StringComparison.OrdinalIgnoreCase)
            );

            // اگر هیچ‌کدام برقرار نبود → خطا
            if (!threeMonthsPassed && !canForceUpdate)
                return BadRequest("وضعیت تعامل فقط پس از ۳ ماه یا با دسترسی ویژه قابل تغییر است.");

            // اعمال بروزرسانی
            if (interaction.IsActive != dto.IsActive)
            {
                interaction.IsActive = dto.IsActive;
                interaction.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                interaction.Id,
                interaction.IsActive,
                message = "Status updated successfully."
            });
        }



        [HttpGet("my")]
        public async Task<IActionResult> GetMyInteractions()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out Guid userId))
                return BadRequest("Invalid user ID");

            // بررسی مجوز مشاهده همه تعاملات
            bool canViewAll = User.HasClaim("Permission", "customerinteraction.GetAll");

            var query = _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Attachments)
                .Include(i => i.InteractionCategories).ThenInclude(ic => ic.Category)
                .Include(i => i.InteractionProducts).ThenInclude(ip => ip.Product)
                .Include(i => i.CreatedBy)
                .Include(i => i.CurrentOwner)
                .Include(i => i.PerformedBy)
                .Include(i => i.Referrals)  // ← اضافه شد
                .AsQueryable();

            if (!canViewAll)
            {
                query = query.Where(i =>
                    i.CurrentOwnerId == userId ||
                    i.Referrals.Any(r => r.AssignedToId == userId)
                );
            }

            var interactions = await query
                .OrderByDescending(i => i.StartDateTime)
                .ToListAsync();

            var interactionsDto = interactions.Select(i => new
            {
                i.Id,
                i.Subject,
                i.Notes,
                i.StartDateTime,
                i.EndDateTime,
                i.DurationMinutes,
                InteractionType = (int)i.InteractionType,
                InteractionTypeLabel = i.InteractionType.ToString(),
                IsActive = i.IsActive,

                CustomerName = i.IndividualCustomer != null
                    ? i.IndividualCustomer.FullName
                    : i.CompanyCustomer?.CompanyName ?? "-",

                IndividualCustomerId = i.IndividualCustomerId,
                CompanyCustomerId = i.CompanyCustomerId,

                Attachments = i.Attachments.Select(a => new
                {
                    a.FilePath,
                    a.OriginalName
                }).ToList(),

                CategoryIds = i.InteractionCategories.Select(ic => ic.CategoryId).ToList(),
                ProductIds = i.InteractionProducts.Select(ip => ip.ProductId).ToList(),

                CreatedByName = i.CreatedBy?.FullName ?? "-",
                CurrentOwnerName = i.CurrentOwner?.FullName ?? "-",
                PerformedByName = i.PerformedBy?.FullName ?? "-",

                IsOwnedByCurrentUser = i.CurrentOwnerId == userId
            });

            return Ok(interactionsDto);
        }



        [HttpGet("categories-with-products")]
        public async Task<IActionResult> GetCategoriesWithProducts()
        {
            var data = await _context.Categories
                .Include(c => c.Products)
                .Where(c => c.IsActive)
                .Select(c => new
                {
                    CategoryId = c.Id,
                    CategoryName = c.Name,
                    Products = c.Products!
                        .Where(p => p.IsActive)
                        .Select(p => new { ProductId = p.Id, ProductName = p.Name })
                        .ToList()
                })
                .ToListAsync();

            return Ok(data);
        }
    }
}
