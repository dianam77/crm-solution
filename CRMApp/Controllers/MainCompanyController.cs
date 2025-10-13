using CRMApp.Data;
using CRMApp.DTOs;
using CRMApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MainCompanyController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public MainCompanyController(CRMAppDbContext context)
        {
            _context = context;
        }

        #region GET

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MainCompanyDto>>> GetAll()
        {
            var companies = await _context.MainCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                    .ThenInclude(a => a.Province)
                .Include(c => c.Addresses)
                    .ThenInclude(a => a.City)
                .Include(c => c.Websites)
                .ToListAsync();

            var dtos = companies.Select(c => new MainCompanyDto
            {
                MainCompanyId = c.MainCompanyId,
                CompanyName = c.CompanyName ?? "-",
                EconomicCode = c.EconomicCode ?? "-",
                RegistrationNumber = c.RegistrationNumber ?? "-",
                Emails = c.Emails.Select(e => new EmailDto
                {
                    EmailId = e.EmailId,
                    EmailAddress = e.EmailAddress,
                    EmailType = e.EmailType,
                    IsPrimary = e.IsPrimary
                }).ToList(),
                ContactPhones = c.ContactPhones.Select(p => new ContactPhoneDto
                {
                    PhoneId = p.PhoneId,
                    PhoneNumber = p.PhoneNumber,
                    PhoneType = p.PhoneType,
                    Extension = p.Extension
                }).ToList(),
                Addresses = c.Addresses.Select(a => new AddressDto
                {
                    AddressId = a.AddressId,
                    FullAddress = a.FullAddress,
                    ProvinceId = a.ProvinceId,
                    ProvinceName = a.Province?.Name ?? "-",
                    CityId = a.CityId,
                    CityName = a.City?.Name ?? "-",
                    PostalCode = a.PostalCode,
                    AddressType = a.AddressType
                }).ToList(),
                Websites = c.Websites.Select(w => new CompanyWebsiteDto
                {
                    WebsiteId = w.WebsiteId,
                    Url = w.Url
                }).ToList()
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MainCompanyDto>> GetById(int id)
        {
            var c = await _context.MainCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                    .ThenInclude(a => a.Province)
                .Include(c => c.Addresses)
                    .ThenInclude(a => a.City)
                .Include(c => c.Websites)
                .FirstOrDefaultAsync(c => c.MainCompanyId == id);

            if (c == null) return NotFound();

            var dto = new MainCompanyDto
            {
                MainCompanyId = c.MainCompanyId,
                CompanyName = string.IsNullOrWhiteSpace(c.CompanyName) ? "-" : c.CompanyName,
                EconomicCode = string.IsNullOrWhiteSpace(c.EconomicCode) ? "-" : c.EconomicCode,
                RegistrationNumber = string.IsNullOrWhiteSpace(c.RegistrationNumber) ? "-" : c.RegistrationNumber,
                Emails = c.Emails.Select(e => new EmailDto
                {
                    EmailId = e.EmailId,
                    EmailAddress = e.EmailAddress ?? "-",
                    EmailType = e.EmailType ?? "-",
                    IsPrimary = e.IsPrimary
                }).ToList(),
                ContactPhones = c.ContactPhones.Select(p => new ContactPhoneDto
                {
                    PhoneId = p.PhoneId,
                    PhoneNumber = p.PhoneNumber ?? "-",
                    PhoneType = p.PhoneType ?? "-",
                    Extension = p.Extension ?? "-"
                }).ToList(),
                Addresses = c.Addresses.Select(a => new AddressDto
                {
                    AddressId = a.AddressId,
                    FullAddress = a.FullAddress ?? "-",
                    ProvinceId = a.ProvinceId,
                    ProvinceName = a.Province?.Name ?? "-",
                    CityId = a.CityId,
                    CityName = a.City?.Name ?? "-",
                    PostalCode = a.PostalCode ?? "-",
                    AddressType = a.AddressType ?? "-"
                }).ToList(),
                Websites = c.Websites.Select(w => new CompanyWebsiteDto
                {
                    WebsiteId = w.WebsiteId,
                    Url = w.Url ?? "-"
                }).ToList()
            };

            return Ok(dto);
        }

        #endregion

        #region POST

        [HttpPost]
        public async Task<ActionResult<MainCompany>> Create([FromBody] MainCompany company)
        {
            if (string.IsNullOrWhiteSpace(company.CompanyName))
                return BadRequest(new { message = "CompanyName is required." });

            PrepareChildEntities(company);

            _context.MainCompanies.Add(company);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = company.MainCompanyId }, company);
        }

        #endregion

        #region PUT

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MainCompany updated)
        {
            if (id != updated.MainCompanyId) return BadRequest();

            var company = await _context.MainCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                .Include(c => c.Websites)
                .FirstOrDefaultAsync(c => c.MainCompanyId == id);

            if (company == null) return NotFound();

            company.CompanyName = updated.CompanyName;
            company.EconomicCode = updated.EconomicCode;
            company.RegistrationNumber = updated.RegistrationNumber;

            UpdateEmails(company.Emails, updated.Emails, company);
            UpdatePhones(company.ContactPhones, updated.ContactPhones, company);
            UpdateAddresses(company.Addresses, updated.Addresses, company);
            UpdateWebsites(company.Websites, updated.Websites, company);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        #endregion

        #region DELETE

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var company = await _context.MainCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                .Include(c => c.Websites)
                .FirstOrDefaultAsync(c => c.MainCompanyId == id);

            if (company == null) return NotFound();

            if (company.Emails.Any()) _context.Emails.RemoveRange(company.Emails);
            if (company.ContactPhones.Any()) _context.ContactPhones.RemoveRange(company.ContactPhones);
            if (company.Addresses.Any()) _context.Addresses.RemoveRange(company.Addresses);
            if (company.Websites.Any()) _context.CompanyWebsites.RemoveRange(company.Websites);

            _context.MainCompanies.Remove(company);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Helper Methods

        private void PrepareChildEntities(MainCompany company)
        {
            if (company.Emails != null)
                foreach (var e in company.Emails)
                {
                    e.EmailId = 0;
                    e.MainCompany = company;
                }

            if (company.ContactPhones != null)
                foreach (var p in company.ContactPhones)
                {
                    p.PhoneId = 0;
                    p.MainCompany = company;
                }

            if (company.Addresses != null)
                foreach (var a in company.Addresses)
                {
                    a.AddressId = 0;
                    a.MainCompany = company;
                }

            if (company.Websites != null)
                foreach (var w in company.Websites)
                {
                    w.WebsiteId = 0;
                    w.MainCompany = company;
                }
        }

        private void UpdateEmails(ICollection<Email> existing, ICollection<Email> updated, MainCompany company)
        {
            if (updated == null) updated = new List<Email>();

            var toRemove = existing.Where(e => !updated.Any(u => u.EmailId == e.EmailId)).ToList();
            foreach (var e in toRemove) { existing.Remove(e); _context.Remove(e); }

            foreach (var u in updated)
            {
                var exist = existing.FirstOrDefault(e => e.EmailId == u.EmailId);
                if (exist != null)
                {
                    exist.EmailAddress = u.EmailAddress;
                    exist.EmailType = u.EmailType;
                    exist.IsPrimary = u.IsPrimary;
                }
                else
                {
                    u.EmailId = 0;
                    u.MainCompany = company;
                    existing.Add(u);
                }
            }
        }

        private void UpdatePhones(ICollection<ContactPhone> existing, ICollection<ContactPhone> updated, MainCompany company)
        {
            if (updated == null) updated = new List<ContactPhone>();

            var toRemove = existing.Where(p => !updated.Any(u => u.PhoneId == p.PhoneId)).ToList();
            foreach (var p in toRemove) { existing.Remove(p); _context.Remove(p); }

            foreach (var u in updated)
            {
                var exist = existing.FirstOrDefault(p => p.PhoneId == u.PhoneId);
                if (exist != null)
                {
                    exist.PhoneNumber = u.PhoneNumber;
                    exist.PhoneType = u.PhoneType;
                    exist.Extension = u.Extension;
                }
                else
                {
                    u.PhoneId = 0;
                    u.MainCompany = company;
                    existing.Add(u);
                }
            }
        }

        private void UpdateAddresses(ICollection<Address> existing, ICollection<Address> updated, MainCompany company)
        {
            if (updated == null) updated = new List<Address>();

            var toRemove = existing.Where(a => !updated.Any(u => u.AddressId == a.AddressId)).ToList();
            foreach (var a in toRemove) { existing.Remove(a); _context.Remove(a); }

            foreach (var u in updated)
            {
                var exist = existing.FirstOrDefault(a => a.AddressId == u.AddressId);
                if (exist != null)
                {
                    exist.FullAddress = u.FullAddress;
                    exist.CityId = u.CityId;
                    exist.ProvinceId = u.ProvinceId;
                    exist.PostalCode = u.PostalCode;
                    exist.AddressType = u.AddressType;
                }
                else
                {
                    u.AddressId = 0;
                    u.MainCompany = company;
                    existing.Add(u);
                }
            }
        }

        private void UpdateWebsites(ICollection<CompanyWebsite> existing, ICollection<CompanyWebsite> updated, MainCompany company)
        {
            if (updated == null) updated = new List<CompanyWebsite>();

            var toRemove = existing.Where(w => !updated.Any(u => u.WebsiteId == w.WebsiteId)).ToList();
            foreach (var w in toRemove) { existing.Remove(w); _context.Remove(w); }

            foreach (var u in updated)
            {
                var exist = existing.FirstOrDefault(w => w.WebsiteId == u.WebsiteId);
                if (exist != null)
                {
                    exist.Url = u.Url;
                }
                else
                {
                    u.WebsiteId = 0;
                    u.MainCompany = company;
                    existing.Add(u);
                }
            }
        }

        #endregion
    }
}
