using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    // تعریف نوع محصول
    public enum ProductType
    {
        Product, // کالا
        Service  // خدمت
    }

    public class Product
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // قیمت اختیاری
        public decimal? Price { get; set; } = null;

        public int? StockQuantity { get; set; } = null;

        public string? SKU { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // نوع محصول یا خدمت
        public ProductType Type { get; set; } = ProductType.Product;

        // ارتباط با دسته‌بندی
        public Guid? CategoryId { get; set; }
        public Category? Category { get; set; }

        // ارتباط با تصاویر
        public ICollection<ProductImage>? Images { get; set; }
    }
}
