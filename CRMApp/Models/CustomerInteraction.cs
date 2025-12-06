using System;
using System.Collections.Generic;
using System.Linq;

namespace CRMApp.Models
{
    public enum InteractionTypeEnum
    {
        Call,
        Meeting,
        Email,
        SMS,
        Note
    }

    // مدل تعامل
    public class CustomerInteraction
    {
        public int Id { get; set; }

        // مشتری حقیقی یا حقوقی
        public int? IndividualCustomerId { get; set; }
        public CustomerIndividual? IndividualCustomer { get; set; }

        public int? CompanyCustomerId { get; set; }
        public CustomerCompany? CompanyCustomer { get; set; }

        public InteractionTypeEnum InteractionType { get; set; }
        public string? Subject { get; set; }
        public string? Notes { get; set; }

        // مالک ایجاد تعامل
        public Guid CreatedById { get; set; }
        public ApplicationUser? CreatedBy { get; set; }

        public Guid? CurrentOwnerId { get; set; }
        public ApplicationUser? CurrentOwner { get; set; }

        // کاربر انجام‌دهنده تعامل
        public Guid PerformedById { get; set; }
        public ApplicationUser? PerformedBy { get; set; }



        // زمان‌ها
        public DateTime StartDateTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndDateTime { get; set; }
        public int? DurationMinutes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } 

        // روابط
        public List<CustomerInteractionProduct> InteractionProducts { get; set; } = new();
        public List<CustomerInteractionCategory> InteractionCategories { get; set; } = new();
        public List<CustomerInteractionAttachment> Attachments { get; set; } = new();

        public List<CustomerInteractionReferral> Referrals { get; set; } = new();

    }




}
