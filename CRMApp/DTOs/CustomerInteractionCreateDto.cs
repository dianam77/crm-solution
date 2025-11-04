namespace CRMApp.DTOs
{
    public class CustomerInteractionCreateDto
    {
        public int InteractionType { get; set; }
        public DateTime StartDateTime { get; set; }
        public int DurationMinutes { get; set; }
        public DateTime EndDateTime { get; set; }
        public string Subject { get; set; }
        public string Notes { get; set; }


        public string CategoryProductGroupsJson { get; set; }

        public int? IndividualCustomerId { get; set; }
        public int? CompanyCustomerId { get; set; }
        public string ExistingAttachmentPaths { get; set; }
    }

}
