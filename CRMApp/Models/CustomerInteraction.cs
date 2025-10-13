namespace CRMApp.Models
{
    public enum InteractionTypeEnum { Call, Meeting, Email, SMS, Note }

    public class CustomerInteraction
    {
        public int Id { get; set; }
        public int? IndividualCustomerId { get; set; }
        public CustomerIndividual? IndividualCustomer { get; set; }
        public int? CompanyCustomerId { get; set; }
        public CustomerCompany? CompanyCustomer { get; set; }
        public InteractionTypeEnum InteractionType { get; set; }
        public DateTime StartDateTime { get; set; } = DateTime.Now;
        public DateTime? EndDateTime { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Subject { get; set; }
        public string? Notes { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

        public ICollection<CustomerInteractionAttachment> Attachments { get; set; } = new List<CustomerInteractionAttachment>();
    }

   
}
