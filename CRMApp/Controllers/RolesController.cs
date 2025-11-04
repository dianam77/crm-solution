using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly CRMAppDbContext _context;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public RolesController(CRMAppDbContext context, RoleManager<ApplicationRole> roleManager)
        {
            _context = context;
            _roleManager = roleManager;
        }


        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.CreatedAt,
                    Permissions = r.RolePermissions.Select(rp => new
                    {
                        rp.Permission.Id,
                        rp.Permission.Name,
                        rp.Permission.Description
                    })
                })
                .ToListAsync();

            return Ok(roles);
        }

       
        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description
                })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(permissions);
        }

   
        [HttpGet("permissions/grouped")]
        public async Task<IActionResult> GetGroupedPermissions()
        {
            var permissions = await _context.Permissions
                .AsNoTracking()
                .ToListAsync();

            var grouped = permissions
                .GroupBy(p => p.Name.Split('.')[0]) 
                .Select(g => new
                {
                    Controller = g.Key,
                    Actions = g.Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Description
                    }).ToList()
                })
                .OrderBy(g => g.Controller)
                .ToList();

            return Ok(grouped);
        }


       
        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto dto)
        {
            if (await _roleManager.RoleExistsAsync(dto.Name))
                return BadRequest("این نقش قبلاً وجود دارد.");

            var role = new ApplicationRole { Name = dto.Name };

            var result = await _roleManager.CreateAsync(role);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            if (dto.PermissionIds.Any())
            {
                var rolePermissions = dto.PermissionIds.Select(pid => new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = pid
                });
                await _context.RolePermissions.AddRangeAsync(rolePermissions);
                await _context.SaveChangesAsync();
            }

            return Ok(role);
        }

        
        [HttpPut("{roleId:guid}")]
        public async Task<IActionResult> UpdateRolePermissions(Guid roleId, [FromBody] UpdateRolePermissionsDto dto)
        {
            var role = await _context.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == roleId);

            if (role == null)
                return NotFound("نقش یافت نشد.");

            _context.RolePermissions.RemoveRange(role.RolePermissions);

            var newPermissions = dto.PermissionIds.Select(pid => new RolePermission
            {
                RoleId = role.Id,
                PermissionId = pid
            });

            await _context.RolePermissions.AddRangeAsync(newPermissions);
            await _context.SaveChangesAsync();

            return Ok(new { message = "دسترسی‌ها بروزرسانی شدند." });

        }

        
        [HttpDelete("{roleId:guid}")]
        public async Task<IActionResult> DeleteRole(Guid roleId)
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
                return NotFound();

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }


    public class CreateRoleDto
    {
        public string Name { get; set; } = null!;
        public List<Guid> PermissionIds { get; set; } = new();
    }

    public class UpdateRolePermissionsDto
    {
        public List<Guid> PermissionIds { get; set; } = new();
    }
}
