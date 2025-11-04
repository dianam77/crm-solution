using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

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
                i.InteractionType,
                i.IndividualCustomerId,
                i.CompanyCustomerId,
                Attachments = i.Attachments.Select(a => new
                {
                    a.FilePath,
                    a.OriginalName 
                }).ToList(),

                CategoryIds = i.InteractionCategories.Select(ic => ic.CategoryId).ToList(),
                ProductIds = i.InteractionProducts.Select(ip => ip.ProductId).ToList()
            }).ToList();

            return Ok(interactionsDto);
        }



        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var interaction = await _context.CustomerInteractions
                .Include(i => i.IndividualCustomer)
                .Include(i => i.CompanyCustomer)
                .Include(i => i.Attachments)
                .Include(i => i.InteractionCategories).ThenInclude(ic => ic.Category)
                .Include(i => i.InteractionProducts).ThenInclude(ip => ip.Product).ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (interaction == null) return NotFound();

            var dto = new
            {
                interaction.Id,
                interaction.Subject,
                interaction.Notes,
                interaction.StartDateTime,
                interaction.EndDateTime,
                interaction.DurationMinutes,
                interaction.InteractionType,
                interaction.IndividualCustomerId,
                interaction.CompanyCustomerId,
                Attachments = interaction.Attachments.Select(a => new
                {
                    a.FilePath,
                    a.OriginalName  
                }).ToList(),
                CategoryIds = interaction.InteractionCategories.Select(ic => ic.CategoryId).ToList(),
                ProductIds = interaction.InteractionProducts.Select(ip => ip.ProductId).ToList()
            };

            return Ok(dto);
        }


        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Create([FromForm] CustomerInteractionUpdateDto dto, [FromForm] List<IFormFile>? attachments)
        {
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
                PerformedBy = User.Identity?.Name ?? "System",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Attachments = new List<CustomerInteractionAttachment>(),
                InteractionCategories = new List<CustomerInteractionCategory>(),
                InteractionProducts = new List<CustomerInteractionProduct>()
            };

     
            var uploadPath = Path.Combine(GetRootPath(), "uploads");
            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

            if (attachments != null)
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file)) return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");
                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadPath, fileName);
                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);
                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = $"/uploads/{fileName}",
                        OriginalName = file.FileName 
                    });

                }
            }

            if (!string.IsNullOrEmpty(dto.ExistingAttachmentPaths))
            {
                foreach (var path in dto.ExistingAttachmentPaths.Split(',', StringSplitOptions.RemoveEmptyEntries))
                    interaction.Attachments.Add(new CustomerInteractionAttachment { FilePath = path.Trim() });
            }

            _context.CustomerInteractions.Add(interaction);
            await _context.SaveChangesAsync(); 

            var groups = dto.GetCategoryProductGroups();
            foreach (var group in groups)
            {
                
                foreach (var catIdStr in group.CategoryIds.Distinct())
                {
                    if (Guid.TryParse(catIdStr, out var catId))
                    {
                        interaction.InteractionCategories.Add(new CustomerInteractionCategory
                        {
                            CustomerInteractionId = interaction.Id,
                            CategoryId = catId
                        });
                    }
                }

           
                foreach (var prodIdStr in group.ProductIds.Distinct())
                {
                    if (Guid.TryParse(prodIdStr, out var prodId))
                    {
                        interaction.InteractionProducts.Add(new CustomerInteractionProduct
                        {
                            CustomerInteractionId = interaction.Id,
                            ProductId = prodId
                        });
                    }
                }
            }

            await _context.SaveChangesAsync(); 
            return Ok(interaction);
        }

        [HttpPut("{id:int}")]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Update(int id, [FromForm] CustomerInteractionUpdateDto dto, [FromForm] List<IFormFile>? attachments)
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

        
            var existingFiles = dto.ExistingAttachmentPaths?.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList() ?? new List<string>();
            var toRemove = interaction.Attachments.Where(a => !existingFiles.Contains(a.FilePath)).ToList();
            foreach (var rem in toRemove)
            {
                var fullPath = Path.Combine(GetRootPath(), rem.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                _context.CustomerInteractionAttachments.Remove(rem);
            }

            
            if (attachments != null)
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file)) return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");
                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadPath, fileName);
                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);
                    interaction.Attachments.Add(new CustomerInteractionAttachment
                    {
                        FilePath = $"/uploads/{fileName}",
                        OriginalName = file.FileName
                    });

                }
            }

           
            _context.CustomerInteractionCategories.RemoveRange(interaction.InteractionCategories);
            _context.CustomerInteractionProducts.RemoveRange(interaction.InteractionProducts);
            await _context.SaveChangesAsync();

       
            var groups = dto.GetCategoryProductGroups();
            foreach (var group in groups)
            {
                foreach (var catIdStr in group.CategoryIds.Distinct())
                {
                    if (Guid.TryParse(catIdStr, out var catId))
                    {
                        interaction.InteractionCategories.Add(new CustomerInteractionCategory
                        {
                            CustomerInteractionId = interaction.Id,
                            CategoryId = catId
                        });
                    }
                }

                foreach (var prodIdStr in group.ProductIds.Distinct())
                {
                    if (Guid.TryParse(prodIdStr, out var prodId))
                    {
                        interaction.InteractionProducts.Add(new CustomerInteractionProduct
                        {
                            CustomerInteractionId = interaction.Id,
                            ProductId = prodId
                        });
                    }
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
