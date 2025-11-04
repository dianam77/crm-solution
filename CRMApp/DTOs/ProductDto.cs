namespace CRMApp.DTOs
{
    public class ProductDto
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal? Price { get; set; }
    }
    
}
