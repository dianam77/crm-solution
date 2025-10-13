using CRMApp.Models.Enums;

namespace CRMApp.DTOs
{
    public class UpdateUserReferralDto
    {
        public string AssignedToId { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public ReferralPriority Priority { get; set; }
        public ReferralStatus Status { get; set; } = ReferralStatus.Pending;
    }
}
