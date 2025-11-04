using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRMApp.Models
{
    public class InvoiceAttachment
    {
        public int Id { get; set; }

        [Required]
        public int InvoiceId { get; set; }
        public Invoice Invoice { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

   
        [NotMapped]
        public string FileUrl => $"https://localhost:44386{FilePath}";
    }
}
