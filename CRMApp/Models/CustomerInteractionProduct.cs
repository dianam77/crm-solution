namespace CRMApp.Models
{
    public class CustomerInteractionProduct
    {
        public int Id { get; set; }

        public int CustomerInteractionId { get; set; }
        public CustomerInteraction CustomerInteraction { get; set; } = null!;

        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;
    }
}
