using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CRMApp.Authorization
{
    // =====================
    // تعریف Requirement
    // =====================
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string PermissionName { get; }

        public PermissionRequirement(string permissionName)
        {
            PermissionName = permissionName;
        }
    }

    // =====================
    // Handler برای بررسی دسترسی‌ها
    // =====================
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly CRMAppDbContext _context;

        public PermissionHandler(UserManager<ApplicationUser> userManager, CRMAppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User == null)
                return;

            // گرفتن UserId از Claims
            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? context.User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return;

            var user = await _userManager.FindByIdAsync(userIdClaim);
            if (user == null)
                return;

            // گرفتن نقش‌های کاربر
            var roles = await _userManager.GetRolesAsync(user);

            // Admin همه دسترسی‌ها را دارد
            if (roles.Contains("Admin"))
            {
                context.Succeed(requirement);
                return;
            }

            // دریافت دسترسی‌ها از Role-Permission
            var rolePermissions = await _context.RolePermissions
                .Include(rp => rp.Role)
                .Include(rp => rp.Permission)
                .Where(rp => roles.Contains(rp.Role.Name))
                .Select(rp => rp.Permission.Name)
                .ToListAsync();

            if (rolePermissions.Contains(requirement.PermissionName))
            {
                context.Succeed(requirement);
            }
        }
    }
}
