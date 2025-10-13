using System;

namespace CRMApp.DTOs
{
    public class InvoiceAttachmentDTO
    {
        public int Id { get; set; } // اگر نیاز به شناسه باشد
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty; // مسیر یا URL فایل
        public string? Description { get; set; } // توضیحات اختیاری
    }
}
