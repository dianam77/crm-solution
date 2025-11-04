using System;

namespace CRMApp.DTOs
{
    public class InvoiceItemDTO
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; } = 0;
        public decimal VATAmount { get; set; } = 0;


        public decimal PriceAfterDiscount => (Quantity * UnitPrice) - Discount;
        public decimal FinalPrice => PriceAfterDiscount + VATAmount;
    }
}
