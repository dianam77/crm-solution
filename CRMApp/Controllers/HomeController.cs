using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace CRMApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomeController : ControllerBase
    {
        private readonly CRMAppDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _config;

        public HomeController(
            CRMAppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration config)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
        }

        // POST: api/home/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest("اطلاعات ورودی نامعتبر است");

            var user = await _userManager.FindByNameAsync(model.Username);
            if (user == null)
                return Unauthorized("نام کاربری یا رمز عبور اشتباه است");

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
                return Unauthorized("نام کاربری یا رمز عبور اشتباه است");

            var roles = await _userManager.GetRolesAsync(user);
            var token = GenerateJwtToken(user, roles);

            return Ok(new { token });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "اطلاعات ورودی نامعتبر است" });

            if (await _userManager.FindByNameAsync(model.Username) != null)
                return BadRequest(new { message = "نام کاربری از قبل وجود دارد" });

            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == model.RoleName);
            if (role == null)
                return BadRequest(new { message = "نقش انتخاب شده معتبر نیست" });

            var user = new ApplicationUser
            {
                UserName = model.Username,
                Email = model.Email
            };

            var createResult = await _userManager.CreateAsync(user, model.Password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            await _userManager.AddToRoleAsync(user, role.Name);

            return Ok(new { message = "ثبت‌نام با موفقیت انجام شد" });
        }


        // GET: api/home/dashboard
        [HttpGet("dashboard")]
        [Authorize]
        public IActionResult Dashboard()
        {
            return Ok(new { message = "به داشبورد خوش آمدید" });
        }

        // متد تولید JWT شامل نقش‌ها
        private string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
