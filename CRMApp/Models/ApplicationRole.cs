using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class ApplicationRole : IdentityRole<Guid>
    {
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
