using System;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        [Required]
        public int InvoiceId { get; set; }
        public Invoice Invoice { get; set; }

        [Required]
        public Guid ProductId { get; set; }
        public Product Product { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal UnitPrice { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Discount { get; set; } = 0;

        [Range(0, double.MaxValue)]
        public decimal VATAmount { get; set; } = 0;

        // ستون‌های واقعی در دیتابیس
        [Range(0, double.MaxValue)]
        public decimal PriceAfterDiscount { get; set; } = 0;

        [Range(0, double.MaxValue)]
        public decimal FinalPrice { get; set; } = 0;
    }
}
