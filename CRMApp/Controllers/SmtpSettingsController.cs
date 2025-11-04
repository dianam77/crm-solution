using CRMApp.Data;
using CRMApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SmtpSettingsController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public SmtpSettingsController(CRMAppDbContext context)
        {
            _context = context;
        }

      
        [HttpGet]
        public async Task<ActionResult<SmtpSettings>> Get()
        {
            var setting = await _context.SmtpSettings.FirstOrDefaultAsync();
            if (setting == null)
                return NotFound();

            return setting;
        }

        [HttpPost]
        public async Task<ActionResult<SmtpSettings>> Create(SmtpSettings setting)
        {
            setting.CreatedAt = DateTime.UtcNow;
            _context.SmtpSettings.Add(setting);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = setting.Id }, setting);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, SmtpSettings setting)
        {
            if (id != setting.Id)
                return BadRequest();

            var existing = await _context.SmtpSettings.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.DisplayName = setting.DisplayName;
            existing.SmtpServer = setting.SmtpServer;
            existing.SmtpPort = setting.SmtpPort;
            existing.SenderEmail = setting.SenderEmail;
            existing.SenderPassword = setting.SenderPassword;
            existing.EnableSsl = setting.EnableSsl;
            existing.IsActive = setting.IsActive;
            existing.Description = setting.Description;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
