namespace CRMApp.Models
{
    public class Service
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ارتباط اختیاری با محصول
        public Guid? ProductId { get; set; }
        public Product? Product { get; set; }
    }
}
