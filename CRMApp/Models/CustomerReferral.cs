using System;

namespace CRMApp.Models
{
    public class CustomerReferral
    {
        public int Id { get; set; }

        public int? IndividualCustomerId { get; set; }
        public int? CompanyCustomerId { get; set; }

        public Guid ReferredById { get; set; }
        public ApplicationUser? ReferredBy { get; set; }

        public Guid AssignedToId { get; set; }
        public ApplicationUser? AssignedTo { get; set; }

        public string? Note { get; set; }

        public DateTime ReferredAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;

        public bool IsRead { get; set; } = false; // اختیاری برای notification/log
    }
}
