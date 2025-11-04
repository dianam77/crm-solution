using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly CRMAppDbContext _context;
        public ProductsController(CRMAppDbContext context) => _context = context;

        private string GetProductsUploadPath()
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "products");
            if (!Directory.Exists(path)) Directory.CreateDirectory(path);
            return path;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts([FromQuery] Guid? categoryId)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .AsQueryable();

            if (categoryId.HasValue && categoryId != Guid.Empty)
                query = query.Where(p => p.CategoryId == categoryId.Value);

            var products = await query.ToListAsync();
            return Ok(products);
        }

      
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(Guid id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();
            return product;
        }

  
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct([FromForm] ProductCreateDto dto)
        {
            var product = new Product
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                IsActive = dto.IsActive,
                Type = dto.Type,
                CategoryId = dto.CategoryId != Guid.Empty ? dto.CategoryId : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Images = new List<ProductImage>()
            };

            var uploadPath = GetProductsUploadPath();

            if (dto.Images != null)
            {
                foreach (var file in dto.Images)
                {
                    var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                    var filePath = Path.Combine(uploadPath, fileName);
                    using var stream = new FileStream(filePath, FileMode.Create);
                    await file.CopyToAsync(stream);

                    product.Images.Add(new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ImageUrl = $"/uploads/products/{fileName}",
                        ProductId = product.Id,
                        Product = product
                    });
                }
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

       
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(Guid id)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            try
            {
                var form = await Request.ReadFormAsync();

                product.Name = form["Name"];
                product.Description = form["Description"];
                product.Price = decimal.TryParse(form["Price"], out var price) ? price : product.Price;
                product.StockQuantity = int.TryParse(form["StockQuantity"], out var stock) ? stock : product.StockQuantity;
                product.IsActive = form["IsActive"] == "true";

                if (Enum.TryParse(form["Type"], out ProductType type)) product.Type = type;
                if (Guid.TryParse(form["CategoryId"], out Guid categoryId) && categoryId != Guid.Empty)
                    product.CategoryId = categoryId;

         
                var existingImagesToKeep = form.ContainsKey("ExistingImagesToKeep")
                    ? form["ExistingImagesToKeep"].ToList()
                    : new List<string>();

                var normalizedKeep = existingImagesToKeep
                    .Select(x => Path.GetFileName(x))
                    .Where(x => !string.IsNullOrEmpty(x))
                    .ToList();

                var imagesToRemove = product.Images
                    .Where(img => !normalizedKeep.Contains(Path.GetFileName(img.ImageUrl)))
                    .ToList();

                foreach (var img in imagesToRemove)
                {
                    var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", img.ImageUrl.TrimStart('/'));
                    if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
                    _context.ProductImages.Remove(img);
                }

        
                var files = form.Files;
                if (files != null && files.Count > 0)
                {
                    var uploadPath = GetProductsUploadPath();
                    foreach (var file in files)
                    {
                        if (file.Length <= 0) continue;

                        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadPath, fileName);
                        using var stream = new FileStream(filePath, FileMode.Create);
                        await file.CopyToAsync(stream);

                        _context.ProductImages.Add(new ProductImage
                        {
                            Id = Guid.NewGuid(),
                            ImageUrl = $"/uploads/products/{fileName}",
                            ProductId = product.Id
                        });
                    }
                }

                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(product);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
                return StatusCode(500, $"خطا در بروزرسانی محصول: {ex.Message}");
            }
        }

    
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            var usedInInvoices = await _context.InvoiceItems.AnyAsync(i => i.ProductId == id);
            if (usedInInvoices)
                return BadRequest("این محصول در فاکتور استفاده شده و نمی‌تواند حذف شود.");

            foreach (var img in product.Images)
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", img.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class ProductCreateDto
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal? Price { get; set; } = null;
        public int StockQuantity { get; set; }
        public bool IsActive { get; set; }
        public ProductType Type { get; set; } = ProductType.Product;
        public Guid CategoryId { get; set; }
        public List<IFormFile>? Images { get; set; }
    }
}
