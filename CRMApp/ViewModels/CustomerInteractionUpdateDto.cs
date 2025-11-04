using System.ComponentModel.DataAnnotations;

namespace CRMApp.ViewModels
{
    public class CustomerInteractionUpdateDto
    {
        [Required(ErrorMessage = "نوع تعامل الزامی است")]
        public int InteractionType { get; set; }  

        public long? IndividualCustomerId { get; set; }
        public long? CompanyCustomerId { get; set; }
        [Required]
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public int? DurationMinutes { get; set; }
        public string? Subject { get; set; }
        public string? Notes { get; set; }
        public string? ExistingAttachmentPaths { get; set; }
    }
}
