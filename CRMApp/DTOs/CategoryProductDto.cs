namespace CRMApp.DTOs
{
    public class CategoryProductDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;


        public bool Selected { get; set; } = false;


        public List<ProductDto> Products { get; set; } = new List<ProductDto>();
    }
}
