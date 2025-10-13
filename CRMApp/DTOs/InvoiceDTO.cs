using CRMApp.Models.Enums;
using System;
using System.Collections.Generic;

namespace CRMApp.DTOs
{
    public class InvoiceDTO
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public InvoiceType InvoiceType { get; set; }
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        public int? CustomerIndividualId { get; set; }
        public int? CustomerCompanyId { get; set; }

        public Guid CreatedByUserId { get; set; }

        public DateTime IssueDate { get; set; } = DateTime.UtcNow;

        // فقط برای پیش‌فاکتور
        public int? ValidityDays { get; set; }

        public DateTime? DueDate { get; set; }

        public string? Notes { get; set; }

        // لیست آیتم‌ها
        public List<InvoiceItemDTO> Items { get; set; } = new List<InvoiceItemDTO>();

        // لیست پیوست‌ها
        public List<InvoiceAttachmentDTO> Attachments { get; set; } = new List<InvoiceAttachmentDTO>();
    }

    
    
}
