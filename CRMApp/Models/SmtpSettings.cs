using System;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.Models
{
   
    public class SmtpSettings
    {
        [Key]
        public int Id { get; set; }


        [Required, EmailAddress, MaxLength(150)]
        public string SenderEmail { get; set; } = string.Empty;


        [Required, MaxLength(200)]
        public string SenderPassword { get; set; } = string.Empty;


        [MaxLength(100)]
        public string DisplayName { get; set; } 

     
        [Required, MaxLength(150)]
        public string SmtpServer { get; set; } 


        [Required]
        public int SmtpPort { get; set; } = 587;

        public bool EnableSsl { get; set; } = true;


        public bool IsActive { get; set; } = true;

        [MaxLength(300)]
        public string? Description { get; set; }


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  
        public DateTime? UpdatedAt { get; set; }
    }
}
