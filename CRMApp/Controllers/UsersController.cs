using CRMApp.Data;
using CRMApp.Models;
using CRMApp.ViewModels;
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

        // GET: api/users
        [HttpGet]
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
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    fullName = user.FullName,
                    isActive = user.IsActive,
                    role = roles.FirstOrDefault() ?? "تعریف نشده"
                });
            }

            return Ok(usersWithRoles);
        }

        // GET: api/users/names
        [HttpGet("names")]
        public async Task<IActionResult> GetUserNames()
        {
            var users = await _context.Users
                .AsNoTracking()
                .Select(u => new { id = u.Id, userName = u.UserName })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/users/roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleManager.Roles
                .Select(r => r.Name)
                .ToListAsync();

            return Ok(roles);
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> EditUser(Guid id, UserEditViewModel model)
        {
            if (id.ToString() != model.Id)
                return BadRequest(new { message = "شناسه کاربر نامعتبر است." });

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound(new { message = "کاربر یافت نشد." });

            // ✅ 1) تغییر رمز قبل از هر تغییری روی UserName/Email
            if (!string.IsNullOrWhiteSpace(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var passResult = await _userManager.ResetPasswordAsync(user, token, model.Password);

                if (!passResult.Succeeded)
                {
                    var errors = string.Join(", ", passResult.Errors.Select(e => e.Description));
                    return BadRequest(new { message = errors });
                }
            }

            // ✅ 2) ویرایش اطلاعات کاربری
            user.UserName = model.UserName;
            user.Email = model.Email;
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.IsActive = model.IsActive;

            var updateUser = await _userManager.UpdateAsync(user);
            if (!updateUser.Succeeded)
            {
                var errors = string.Join(", ", updateUser.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            // ✅ 3) ویرایش نقش‌ها
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
                await _userManager.RemoveFromRolesAsync(user, currentRoles);

            if (!string.IsNullOrWhiteSpace(model.Role))
            {
                if (!await _roleManager.RoleExistsAsync(model.Role))
                    await _roleManager.CreateAsync(new ApplicationRole
                    {
                        Name = model.Role,
                        NormalizedName = model.Role.ToUpper()
                    });

                await _userManager.AddToRoleAsync(user, model.Role);
            }

            return NoContent();
        }


        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/users
        [HttpPost]
        public async Task<IActionResult> CreateUser(UserEditViewModel model)
        {
            if (string.IsNullOrWhiteSpace(model.UserName) || string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "نام کاربری، ایمیل و رمز عبور الزامی هستند." });

            var user = new ApplicationUser
            {
                UserName = model.UserName,
                Email = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                IsActive = model.IsActive
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            if (!string.IsNullOrWhiteSpace(model.Role))
            {
                if (!await _roleManager.RoleExistsAsync(model.Role))
                    await _roleManager.CreateAsync(new ApplicationRole { Name = model.Role });

                await _userManager.AddToRoleAsync(user, model.Role);
            }

            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, new { user.Id });
        }
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            var user = await _userManager.FindByIdAsync(model.Id);
            if (user == null)
                return NotFound(new { message = "کاربر یافت نشد." });

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            return Ok(new { message = "رمز عبور با موفقیت تغییر کرد." });
        }


        // GET: api/users/current
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized(new { message = "کاربر یافت نشد یا لاگین نکرده است." });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                userName = user.UserName,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                fullName = user.FullName,
                isActive = user.IsActive,
                role = roles.FirstOrDefault() ?? "تعریف نشده"
            });
        }
        public class ChangePasswordViewModel
        {
            public string Id { get; set; }
            public string NewPassword { get; set; }
        }
    }
}
