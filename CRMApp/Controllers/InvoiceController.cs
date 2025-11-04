using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using CRMApp.Models.Enums;
using CRMApp.Services;
using CRMApp.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoiceController : ControllerBase
    {
        private readonly CRMAppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public InvoiceController(CRMAppDbContext context, IWebHostEnvironment env)
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

        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Create([FromForm] InvoiceCreateDto dto, [FromForm] List<IFormFile>? attachments)
        {
            if (!Enum.TryParse<InvoiceType>(dto.InvoiceType, true, out var parsedType))
                return BadRequest("نوع فاکتور نامعتبر است.");

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.microsoft.com/identity/claims/objectidentifier" ||
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" ||
                c.Type == ClaimTypes.NameIdentifier
            )?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("کاربر شناسایی نشد.");

            var invoice = new Invoice
            {
                InvoiceNumber = dto.InvoiceNumber,
                InvoiceType = parsedType,
                IssueDate = dto.IssueDate,
                ValidityDays = dto.ValidityDays ?? 0,
                CustomerIndividualId = dto.CustomerIndividualId,
                CustomerCompanyId = dto.CustomerCompanyId,
                Notes = dto.Notes,
                CreatedByUserId = userId,
            };

         
            var items = JsonSerializer.Deserialize<List<InvoiceItem>>(dto.ItemsJson ?? "[]") ?? new List<InvoiceItem>();
            if (items.Any())
            {
                var productIds = items.Select(i => i.ProductId).ToList();
                var existingProducts = await _context.Products
                    .Where(p => productIds.Contains(p.Id))
                    .Select(p => p.Id)
                    .ToListAsync();

                var invalidProducts = productIds.Except(existingProducts).ToList();
                if (invalidProducts.Any())
                    return BadRequest($"آیتم‌هایی با ProductId نامعتبر وجود دارد: {string.Join(", ", invalidProducts)}");

                foreach (var item in items)
                {
                   
                    item.PriceAfterDiscount = (item.Quantity * item.UnitPrice) - item.Discount;
                    item.FinalPrice = item.PriceAfterDiscount + item.VATAmount;

                    invoice.InvoiceItems.Add(item);
                }
            }

      
            var uploadPath = Path.Combine(GetRootPath(), "uploads");
            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

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

                    invoice.Attachments.Add(new InvoiceAttachment
                    {
                        FileName = file.FileName,
                        FilePath = $"/uploads/{fileName}"   
                    });
                }
            

        }


        _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return Ok(invoice);
        }

        [HttpPut("{id:int}")]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Update(int id, [FromForm] InvoiceUpdateDto dto, [FromForm] List<IFormFile>? attachments)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            invoice.InvoiceNumber = dto.InvoiceNumber;
            invoice.InvoiceType = dto.InvoiceType;
            invoice.Status = dto.Status; 
            invoice.IssueDate = dto.IssueDate;
            invoice.ValidityDays = dto.ValidityDays ?? 0;
            invoice.CustomerIndividualId = dto.CustomerIndividualId;
            invoice.CustomerCompanyId = dto.CustomerCompanyId;
            invoice.Notes = dto.Notes;
            invoice.UpdatedAt = DateTime.UtcNow;

           
            invoice.InvoiceItems.Clear();
            var newItems = JsonSerializer.Deserialize<List<InvoiceItem>>(dto.ItemsJson ?? "[]") ?? new List<InvoiceItem>();
            foreach (var item in newItems)
            {
                item.PriceAfterDiscount = (item.Quantity * item.UnitPrice) - item.Discount;
                item.FinalPrice = item.PriceAfterDiscount + item.VATAmount;
                invoice.InvoiceItems.Add(item);
            }

            var uploadPath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads");
            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);
            invoice.Attachments ??= new List<InvoiceAttachment>();

            var existingIds = dto.ExistingAttachmentIds?
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(x => int.Parse(x.Trim()))
                .ToList() ?? new List<int>();

            var toRemove = invoice.Attachments.Where(a => !existingIds.Contains(a.Id)).ToList();
            foreach (var rem in toRemove)
            {
                var fullPath = Path.Combine(_env.WebRootPath ?? "wwwroot", rem.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                _context.InvoiceAttachments.Remove(rem);
            }

            if (attachments != null && attachments.Any())
            {
                foreach (var file in attachments)
                {
                    if (!IsValidFile(file)) return BadRequest($"نوع فایل {file.FileName} مجاز نیست.");

                    var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadPath, fileName);

                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);

                    invoice.Attachments.Add(new InvoiceAttachment
                    {
                        FileName = file.FileName,
                        FilePath = $"/uploads/{fileName}"
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(invoice);
        }



        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _context.Invoices
                .Include(i => i.CustomerIndividual)
                .Include(i => i.CustomerCompany)
                .Include(i => i.InvoiceItems)
                .Include(i => i.Attachments)
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();

            return Ok(invoices ?? new List<Invoice>());
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.CustomerIndividual)
                .Include(i => i.CustomerCompany)
                .Include(i => i.InvoiceItems)
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
                return NotFound();

            return Ok(invoice);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Attachments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
                return NotFound();

            foreach (var att in invoice.Attachments)
            {
                var fullPath = Path.Combine(GetRootPath(), att.FilePath.TrimStart('/'));
                try { if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath); } catch { }
            }

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<CRMApp.DTOs.InvoicePrintCompanyInfo> GetSellerInfoAsync()
        {
            var mainCompany = await _context.MainCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                    .ThenInclude(a => a.City)
                .Include(c => c.Addresses)
                    .ThenInclude(a => a.Province)
                .Include(c => c.Websites)
                .FirstOrDefaultAsync();

            var sellerInfo = new CRMApp.DTOs.InvoicePrintCompanyInfo();

            if (mainCompany != null)
            {
                sellerInfo.CompanyName = mainCompany.CompanyName ?? "-";
                sellerInfo.EconomicCode = mainCompany.EconomicCode ?? "-";
                sellerInfo.RegistrationNumber = mainCompany.RegistrationNumber ?? "-";

                sellerInfo.Emails = mainCompany.Emails.Any()
                    ? string.Join("، ", mainCompany.Emails.Select(e => e.EmailAddress))
                    : "-";

                sellerInfo.ContactPhones = mainCompany.ContactPhones.Any()
                    ? string.Join("، ", mainCompany.ContactPhones.Select(p => p.PhoneNumber))
                    : "-";

                sellerInfo.Websites = mainCompany.Websites.Any()
                    ? string.Join("، ", mainCompany.Websites.Select(w => w.Url))
                    : "-";

       
                if (mainCompany.Addresses.Any())
                {
                    var addr = mainCompany.Addresses.First(); 
                    sellerInfo.Province = addr.Province?.Name ?? "-";
                    sellerInfo.City = addr.City?.Name ?? "-";
                    sellerInfo.PostalCode = addr.PostalCode ?? "-";
                    sellerInfo.FullAddress = addr.FullAddress ?? "-";
                }
            }

            return sellerInfo;
        }

       
        [HttpGet("{id:int}/pdf")]
        public async Task<IActionResult> GetInvoicePdf(int id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.InvoiceItems)
                        .ThenInclude(ii => ii.Product)
                    .Include(i => i.CustomerIndividual)
                        .ThenInclude(c => c.Addresses)
                            .ThenInclude(a => a.City)
                    .Include(i => i.CustomerIndividual)
                        .ThenInclude(c => c.Addresses)
                            .ThenInclude(a => a.Province)
                    .Include(i => i.CustomerCompany)
                        .ThenInclude(c => c.Addresses)
                            .ThenInclude(a => a.City)
                    .Include(i => i.CustomerCompany)
                        .ThenInclude(c => c.Addresses)
                            .ThenInclude(a => a.Province)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (invoice == null)
                    return NotFound($"فاکتوری با شناسه {id} یافت نشد.");

                invoice.InvoiceItems ??= new List<InvoiceItem>();
                foreach (var item in invoice.InvoiceItems)
                    item.Product ??= new Product { Name = "-" };

                var customerInfo = new DTOs.InvoicePrintCustomerInfo();
      
                var sellerInfo = await GetSellerInfoAsync();

                var pdfGenerator = new InvoicePdfGenerator(invoice, customerInfo, sellerInfo);
                var pdfBytes = pdfGenerator.GeneratePdf();

                return File(pdfBytes, "application/pdf", $"Invoice-{invoice.InvoiceNumber}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"خطای سرور هنگام تولید PDF: {ex.Message}\n{ex.StackTrace}");
            }
        }

    }
}
