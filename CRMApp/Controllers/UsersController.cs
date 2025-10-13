using CRMApp.Constants;
using CRMApp.Data;
using CRMApp.Models;
using CRMApp.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly CRMAppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public UsersController(
            CRMAppDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // --------------------------
        // متد لیست کامل کاربران
        // فقط برای Admin و Manager
        // --------------------------
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.AsNoTracking().ToListAsync();

            var usersWithRoles = new List<object>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                usersWithRoles.Add(new
                {
                    id = user.Id,
                    userName = user.UserName,
                    email = user.Email,
                    role = roles.FirstOrDefault() ?? "تعریف نشده"
                });
            }

            return Ok(usersWithRoles);
        }

        // --------------------------
        // متد لیست اسامی کاربران
        // برای همه نقش‌ها (User، Admin، Manager)
        // --------------------------
        [HttpGet("names")]
        [Authorize(Roles = "User,Admin,Manager")]
        public async Task<IActionResult> GetUserNames()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Select(u => new { id = u.Id, userName = u.UserName })
                .ToListAsync();

            return Ok(users);
        }

        // --------------------------
        // متد دریافت لیست نقش‌ها
        // فقط Admin
        // --------------------------
        [HttpGet("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleManager.Roles
                .Select(r => r.Name)
                .ToListAsync();

            return Ok(roles);
        }

        // --------------------------
        // ویرایش کاربر
        // فقط برای Admin و Manager
        // --------------------------
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> EditUser(Guid id, UserEditViewModel model)
        {
            if (id.ToString() != model.Id)
                return BadRequest();

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            user.UserName = model.UserName;
            user.Email = model.Email;

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            if (!string.IsNullOrEmpty(model.Role))
            {
                if (!await _roleManager.RoleExistsAsync(model.Role))
                    await _roleManager.CreateAsync(new ApplicationRole { Name = model.Role });

                await _userManager.AddToRoleAsync(user, model.Role);
            }

            if (!string.IsNullOrWhiteSpace(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, model.Password);
                if (!result.Succeeded)
                    return BadRequest(result.Errors);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // --------------------------
        // حذف کاربر
        // فقط برای Admin و Manager
        // --------------------------
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
