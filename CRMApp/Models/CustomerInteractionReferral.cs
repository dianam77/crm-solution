using CRMApp.Models;

public class CustomerInteractionReferral
{
    public int Id { get; set; }

    // 👇 مشتری
    public int CustomerId { get; set; }
    public bool IsIndividual { get; set; }

    // 👇 ارجاع‌دهنده
    public Guid ReferredById { get; set; }
    public ApplicationUser? ReferredBy { get; set; }

    // 👇 دریافت‌کننده
    public Guid AssignedToId { get; set; }
    public ApplicationUser? AssignedTo { get; set; }

    public string? Note { get; set; }
    public DateTime ReferredAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
    public bool IsRead { get; set; } = false;
}
