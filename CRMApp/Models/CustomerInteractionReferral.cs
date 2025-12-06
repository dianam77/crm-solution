using System;

namespace CRMApp.Models
{
    public class CustomerInteractionReferral
    {
        public int Id { get; set; }

        // تعامل ارجاع داده شده
        public int InteractionId { get; set; }
        public CustomerInteraction Interaction { get; set; } = null!;

        // کاربر ارجاع‌دهنده
        public Guid ReferredById { get; set; }
        public ApplicationUser? ReferredBy { get; set; }

        // کاربر گیرنده ارجاع
        public Guid AssignedToId { get; set; }
        public ApplicationUser? AssignedTo { get; set; }

        // یادداشت ارجاع
        public string? Note { get; set; }

        // تاریخ ارجاع
        public DateTime ReferredAt { get; set; } = DateTime.UtcNow;

        // وضعیت فعال یا انجام شده
        public bool IsActive { get; set; } = true;

        // ✅ وضعیت خوانده شده
        public bool IsRead { get; set; } = false;
    }
}
