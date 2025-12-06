using CRMApp.DTOs;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]

    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public AuthController(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            if (await _userManager.FindByNameAsync(model.Username) != null)
                return BadRequest(new { message = "نام کاربری تکراری است" });

            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Email
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            if (!await _roleManager.RoleExistsAsync(model.RoleName))
                await _roleManager.CreateAsync(new ApplicationRole { Name = model.RoleName });

            await _userManager.AddToRoleAsync(user, model.RoleName);

            // حتما JSON برگردان و status کد 200
            return Ok(new { message = "ثبت‌نام با موفقیت انجام شد" });
        }

    }
}
