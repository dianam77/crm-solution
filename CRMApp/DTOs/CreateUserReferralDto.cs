using CRMApp.Models.Enums;
using System;

namespace CRMApp.DTOs
{
    // DTO برای ساخت ارجاع جدید
    public class CreateUserReferralDto
    {
        public string AssignedById { get; set; }
        public string AssignedToId { get; set; }
        public string Notes { get; set; }
        public ReferralPriority Priority { get; set; }
    }

}
