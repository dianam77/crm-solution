using CRMApp.Models.Enums;

namespace CRMApp.Models
{
    public class UserReferral
    {
        public int Id { get; set; }

        public Guid AssignedById { get; set; }
        public ApplicationUser AssignedBy { get; set; } = null!;

        public Guid AssignedToId { get; set; }
        public ApplicationUser AssignedTo { get; set; } = null!;

      
        public string? Notes { get; set; }

        public ReferralStatus Status { get; set; } = ReferralStatus.Pending;

        public ReferralPriority Priority { get; set; } = ReferralPriority.Medium;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }
    }
}
