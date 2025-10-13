using System;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.ViewModels
{
    public class InvoiceCreateDto
    {
        [Required, MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public string InvoiceType { get; set; } = string.Empty;

        public int? CustomerIndividualId { get; set; }
        public int? CustomerCompanyId { get; set; }

        [Required]
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;

        public int? ValidityDays { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }

        [Required]
        public string ItemsJson { get; set; } = "[]";

        public string? ExistingAttachmentPaths { get; set; }
    }
}
