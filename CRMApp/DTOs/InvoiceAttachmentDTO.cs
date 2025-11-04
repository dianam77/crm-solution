using System;

namespace CRMApp.DTOs
{
    public class InvoiceAttachmentDTO
    {
        public int Id { get; set; } 
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty; 
        public string? Description { get; set; }
    }
}
