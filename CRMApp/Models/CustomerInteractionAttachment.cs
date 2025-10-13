namespace CRMApp.Models
{
    public class CustomerInteractionAttachment
    {
        public int Id { get; set; }
        public int CustomerInteractionId { get; set; }
        public CustomerInteraction CustomerInteraction { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
