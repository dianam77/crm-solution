using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    
    public enum ProductType
    {
        Product, 
        Service 
    }

    public class Product
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;


        public decimal? Price { get; set; } = null;

        public int? StockQuantity { get; set; } = null;

        public string? SKU { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }


        public ProductType Type { get; set; } = ProductType.Product;

        public Guid? CategoryId { get; set; }
        public Category? Category { get; set; }

        public ICollection<ProductImage>? Images { get; set; }
    }
}
