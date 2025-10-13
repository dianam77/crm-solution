using System;

namespace CRMApp.Models
{
    public class ProductImage
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string ImageUrl { get; set; } = string.Empty;

        // FK به محصول
        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;
    }
}
