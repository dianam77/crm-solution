using Microsoft.AspNetCore.Identity;
using System;

namespace CRMApp.Models
{
    public class UserRole : IdentityUserRole<Guid>
    {
        public virtual ApplicationUser User { get; set; }
        public virtual ApplicationRole Role { get; set; }
    }
}
