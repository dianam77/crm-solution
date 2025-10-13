using CRMApp.Models.Enums;

public class CreateUserReferralDto
{
    public string AssignedById { get; set; } = string.Empty;
    public string AssignedToId { get; set; } = string.Empty; // فقط یک گیرنده
    public string? Notes { get; set; }
    public ReferralPriority Priority { get; set; }
}
