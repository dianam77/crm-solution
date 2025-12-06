using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class UserReferral
    {
        public int Id { get; set; }

        // کاربری که ارجاع را ایجاد کرده
        public Guid AssignedById { get; set; }
        public ApplicationUser AssignedBy { get; set; } = null!;

        // کاربری که ارجاع برای اوست
        public Guid AssignedToId { get; set; }
        public ApplicationUser AssignedTo { get; set; } = null!;

        // مشتری هدف ارجاع
        public int? IndividualCustomerId { get; set; }
        public CustomerIndividual? IndividualCustomer { get; set; }

        public int? CompanyCustomerId { get; set; }
        public CustomerCompany? CompanyCustomer { get; set; }

        // توضیح / یادداشت
        public string? Notes { get; set; }

        // وضعیت ارجاع
        public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }
    }
}
