using CRMApp.Models.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace CRMApp.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public InvoiceType InvoiceType { get; set; }

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        public int? CustomerIndividualId { get; set; }
        public CustomerIndividual? CustomerIndividual { get; set; }

        public int? CustomerCompanyId { get; set; }
        public CustomerCompany? CustomerCompany { get; set; }

        [Required]
        public Guid CreatedByUserId { get; set; }
        public ApplicationUser CreatedByUser { get; set; }

        [Required]
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;

        [Range(0, int.MaxValue)]
        public int ValidityDays { get; set; } = 0;

        private DateTime? _dueDate;
        public DateTime? DueDate
        {
            get
            {
                if (InvoiceType == InvoiceType.Proforma && ValidityDays > 0)
                    return IssueDate.AddDays(ValidityDays);
                return _dueDate;
            }
            set
            {
                _dueDate = value;
            }
        }

        public string? Notes { get; set; }

        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
        public ICollection<InvoiceAttachment> Attachments { get; set; } = new List<InvoiceAttachment>();


        public decimal TotalAmountWithoutVAT => InvoiceItems?.Sum(i => i.PriceAfterDiscount) ?? 0;


        public decimal TotalVATAmount => InvoiceItems?.Sum(i => i.VATAmount) ?? 0;


        public decimal TotalAmount => InvoiceItems?.Sum(i => i.FinalPrice) ?? 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
