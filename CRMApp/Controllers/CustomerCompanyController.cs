using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CRMApp.Models;
using CRMApp.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager,User")]
    public class CustomerCompanyApiController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public CustomerCompanyApiController(CRMAppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerCompany>>> GetCompanies()
        {
            var companies = await _context.CustomerCompanies
                .Include(c => c.CustomerCompanyRelations).ThenInclude(r => r.IndividualCustomer)
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                .ToListAsync();

            return Ok(companies ?? new List<CustomerCompany>());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerCompany>> GetCompany(int id)
        {
            var company = await _context.CustomerCompanies
                .Include(c => c.CustomerCompanyRelations).ThenInclude(r => r.IndividualCustomer)
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (company == null) return NotFound();
            return Ok(company);
        }

        [HttpPost]
        public async Task<ActionResult<CustomerCompany>> CreateCompany([FromBody] CustomerCompany company)
        {
            if (string.IsNullOrWhiteSpace(company.CompanyName))
                return BadRequest(new { message = "CompanyName is required." });

            PrepareChildEntities(company);
            _context.CustomerCompanies.Add(company);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCompany), new { id = company.CustomerId }, company);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateCompany(int id, [FromBody] CustomerCompany updatedCompany)
        {
            if (id != updatedCompany.CustomerId) return BadRequest();

            var company = await _context.CustomerCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                .Include(c => c.CustomerCompanyRelations)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (company == null) return NotFound();

            company.CompanyName = updatedCompany.CompanyName;
            company.EconomicCode = updatedCompany.EconomicCode;
            company.NationalId = updatedCompany.NationalId;
            company.RegisterNumber = updatedCompany.RegisterNumber;
            company.EstablishmentDate = updatedCompany.EstablishmentDate;
            company.IndustryField = updatedCompany.IndustryField;
            company.Website = updatedCompany.Website;

            UpdateEmails(company.Emails, updatedCompany.Emails, company);
            UpdateContactPhones(company.ContactPhones, updatedCompany.ContactPhones, company);
            UpdateAddresses(company.Addresses, updatedCompany.Addresses, company);
            UpdateRelations(company.CustomerCompanyRelations, updatedCompany.CustomerCompanyRelations, company);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCompany(int id)
        {
            var company = await _context.CustomerCompanies
                .Include(c => c.Emails)
                .Include(c => c.ContactPhones)
                .Include(c => c.Addresses)
                .Include(c => c.CustomerCompanyRelations)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (company == null) return NotFound();

            if (company.Emails.Any()) _context.Emails.RemoveRange(company.Emails);
            if (company.ContactPhones.Any()) _context.ContactPhones.RemoveRange(company.ContactPhones);
            if (company.Addresses.Any()) _context.Addresses.RemoveRange(company.Addresses);
            if (company.CustomerCompanyRelations.Any()) _context.CustomerCompanyRelations.RemoveRange(company.CustomerCompanyRelations);

            _context.CustomerCompanies.Remove(company);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        #region Helper Methods

        private void PrepareChildEntities(CustomerCompany company)
        {
            if (company.Emails != null)
                foreach (var e in company.Emails)
                {
                    e.EmailId = 0;
                    e.CompanyCustomer = company;
                    e.IndividualCustomer = null;
                    e.IndividualCustomerId = null;
                }

            if (company.ContactPhones != null)
                foreach (var p in company.ContactPhones)
                {
                    p.PhoneId = 0;
                    p.CompanyCustomer = company;
                    p.IndividualCustomer = null;
                    p.IndividualCustomerId = null;
                }

            if (company.Addresses != null)
                foreach (var a in company.Addresses)
                {
                    a.AddressId = 0;
                    a.CompanyCustomer = company;
                    a.IndividualCustomer = null;
                    a.IndividualCustomerId = null;
                }

            if (company.CustomerCompanyRelations != null)
                foreach (var r in company.CustomerCompanyRelations)
                {
                    r.RelationId = 0;
                    r.CompanyCustomer = company;
                }
        }

        private void UpdateEmails(List<Email> existingList, List<Email> updatedList, CustomerCompany company)
        {
            if (updatedList == null) updatedList = new List<Email>();
            var toRemove = existingList.Where(e => !updatedList.Any(u => u.EmailId == e.EmailId)).ToList();
            foreach (var item in toRemove) { existingList.Remove(item); _context.Remove(item); }

            foreach (var item in updatedList)
            {
                var existing = existingList.FirstOrDefault(e => e.EmailId == item.EmailId);
                if (existing != null)
                {
                    existing.EmailAddress = item.EmailAddress;
                    existing.EmailType = item.EmailType;
                    existing.IsPrimary = item.IsPrimary;
                }
                else
                {
                    item.EmailId = 0;
                    item.CompanyCustomer = company;
                    item.IndividualCustomer = null;
                    item.IndividualCustomerId = null;
                    existingList.Add(item);
                }
            }
        }

        private void UpdateContactPhones(List<ContactPhone> existingList, List<ContactPhone> updatedList, CustomerCompany company)
        {
            if (updatedList == null) updatedList = new List<ContactPhone>();
            var toRemove = existingList.Where(e => !updatedList.Any(u => u.PhoneId == e.PhoneId)).ToList();
            foreach (var item in toRemove) { existingList.Remove(item); _context.Remove(item); }

            foreach (var item in updatedList)
            {
                var existing = existingList.FirstOrDefault(e => e.PhoneId == item.PhoneId);
                if (existing != null)
                {
                    existing.PhoneNumber = item.PhoneNumber;
                    existing.Extension = item.Extension;
                    existing.PhoneType = item.PhoneType;
                }
                else
                {
                    item.PhoneId = 0;
                    item.CompanyCustomer = company;
                    item.IndividualCustomer = null;
                    item.IndividualCustomerId = null;
                    existingList.Add(item);
                }
            }
        }

        private void UpdateAddresses(List<Address> existingList, List<Address> updatedList, CustomerCompany company)
        {
            if (updatedList == null) updatedList = new List<Address>();
            var toRemove = existingList.Where(e => !updatedList.Any(u => u.AddressId == e.AddressId)).ToList();
            foreach (var item in toRemove) { existingList.Remove(item); _context.Remove(item); }

            foreach (var item in updatedList)
            {
                var existing = existingList.FirstOrDefault(e => e.AddressId == item.AddressId);
                if (existing != null)
                {
                    existing.FullAddress = item.FullAddress;
                    existing.CityId = item.CityId;
                    existing.ProvinceId = item.ProvinceId;
                    existing.PostalCode = item.PostalCode;
                    existing.AddressType = item.AddressType;
                }
                else
                {
                    item.AddressId = 0;
                    item.CompanyCustomer = company;
                    item.IndividualCustomer = null;
                    item.IndividualCustomerId = null;
                    existingList.Add(item);
                }
            }
        }

        private void UpdateRelations(List<CustomerCompanyRelation> existingRelations, List<CustomerCompanyRelation> updatedRelations, CustomerCompany company)
        {
            if (updatedRelations == null) updatedRelations = new List<CustomerCompanyRelation>();
            var toRemove = existingRelations.Where(r => !updatedRelations.Any(u => u.RelationId == r.RelationId)).ToList();
            foreach (var item in toRemove)
            {
                existingRelations.Remove(item);
                _context.Remove(item);
            }

            foreach (var updated in updatedRelations)
            {
                var existing = existingRelations.FirstOrDefault(r => r.RelationId == updated.RelationId);
                if (existing != null)
                {
                    existing.RelationType = updated.RelationType;
                    existing.StartDate = updated.StartDate;
                    existing.Description = updated.Description;
                    existing.IndividualCustomerId = updated.IndividualCustomerId;
                }
                else
                {
                    updated.RelationId = 0;
                    updated.CompanyCustomerId = company.CustomerId;
                    updated.CompanyCustomer = company;
                    existingRelations.Add(updated);
                }
            }
        }

        #endregion
    }
}
