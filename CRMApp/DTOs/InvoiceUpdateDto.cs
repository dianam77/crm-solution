using System.ComponentModel.DataAnnotations;
using CRMApp.Models.Enums;

namespace CRMApp.DTOs
{
    public class InvoiceUpdateDto
    {
        [Required]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public InvoiceType InvoiceType { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        public int? CustomerIndividualId { get; set; }
        public int? CustomerCompanyId { get; set; }

        [Required]
        public Guid CreatedByUserId { get; set; }

        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }
        public int? ValidityDays { get; set; }
        public string? Notes { get; set; }

     
        [Required]
        public string ItemsJson { get; set; } = string.Empty;

       
        public string? ExistingAttachmentPaths { get; set; }

      
        public string? ExistingAttachmentIds { get; set; } 
    }
}
