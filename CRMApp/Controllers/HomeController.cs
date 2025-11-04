using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using CRMApp.Services;
using CRMApp.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
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
        private readonly TokenService _tokenService;
        private readonly IEmailService _emailService;

        public HomeController(
            CRMAppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration config,
            TokenService tokenService,
            IEmailService emailService)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _tokenService = tokenService;
            _emailService = emailService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { message = "اطلاعات ورودی نامعتبر است" });

            var user = await _userManager.FindByNameAsync(model.Username);
            if (user == null)
                return Unauthorized(new { message = "نام کاربری یا رمز عبور اشتباه است" });

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
                return Unauthorized(new { message = "نام کاربری یا رمز عبور اشتباه است" });

            var roles = await _userManager.GetRolesAsync(user);
            var token = _tokenService.GenerateToken(user, roles);

            return Ok(new { token });
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
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

 
        [HttpGet("dashboard")]
        [Authorize]
        public IActionResult Dashboard()
        {
            var username = User.Identity?.Name;
            var roles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            return Ok(new { message = $"خوش آمدی {username}", roles });
        }

       
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Email))
                return BadRequest(new { message = "لطفاً ایمیل خود را وارد کنید." });

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                
                return Ok(new { message = "در صورت معتبر بودن ایمیل، دستورالعمل بازیابی رمز عبور ارسال خواهد شد." });
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var frontendUrl = "http://localhost:4200/reset-password";
            var resetLink = $"{frontendUrl}?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

          
            var smtpSettings = await _dbContext.SmtpSettings.FirstOrDefaultAsync(s => s.IsActive);
            if (smtpSettings == null || string.IsNullOrWhiteSpace(smtpSettings.SenderEmail))
            {
                return StatusCode(503, new { message = "تنظیمات ایمیل هنوز توسط مدیر سیستم انجام نشده است." });
            }

            try
            {
                var body = $@"
                    <p>برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:</p>
                    <p><a href='{resetLink}'>بازیابی رمز عبور</a></p>
                    <p>اگر این درخواست از طرف شما نبوده، این ایمیل را نادیده بگیرید.</p>";

                await _emailService.SendAsync(
                    user.Email,
                    "بازیابی رمز عبور",
                    body,
                    smtpSettings
                );
            }
            catch (Exception exEmail)
            {
                Console.WriteLine("SMTP error: " + exEmail.Message);
                return StatusCode(500, new { message = "ارسال ایمیل موفق نبود. لطفاً بعداً تلاش کنید." });
            }

            return Ok(new { message = "در صورت معتبر بودن ایمیل، دستورالعمل بازیابی رمز عبور ارسال خواهد شد." });
        }

        
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Token) ||
                string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest(new { message = "اطلاعات ناقص است" });
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return BadRequest(new { message = "کاربر یافت نشد" });

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return BadRequest(new { message = errors });
            }

            return Ok(new { message = "رمز عبور با موفقیت تغییر کرد" });
        }
    }
}
