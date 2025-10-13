using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CRMApp.Data;
using CRMApp.Models;
using CRMApp.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerIndividualApiController : ControllerBase
    {
        private readonly CRMAppDbContext _context;

        public CustomerIndividualApiController(CRMAppDbContext context)
        {
            _context = context;
        }

        #region GET

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<List<CustomerIndividual>>> GetAll()
        {
            var individuals = await _context.CustomerIndividuals
                .Include(i => i.Emails)
                .Include(i => i.ContactPhones)
                .Include(i => i.Addresses)
                    .ThenInclude(a => a.Province)
                .Include(i => i.Addresses)
                    .ThenInclude(a => a.City)
                .ToListAsync();

            // همیشه JSON معتبر برگردان
            return Ok(individuals ?? new List<CustomerIndividual>());
        }

        [HttpGet("provinces")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<List<Province>>> GetProvinces()
        {
            var provinces = await _context.Provinces
                .Include(p => p.Cities)
                .ToListAsync();

            return Ok(provinces ?? new List<Province>());
        }

        [HttpGet("cities/{provinceId}")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<List<City>>> GetCities(int provinceId)
        {
            var cities = await _context.Cities
                .Where(c => c.ProvinceId == provinceId)
                .ToListAsync();

            // همیشه JSON برگردان حتی اگر خالی باشد
            return Ok(cities ?? new List<City>());
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<CustomerIndividualViewModel>> Get(int id)
        {
            var individual = await _context.CustomerIndividuals
                .Include(i => i.Emails)
                .Include(i => i.ContactPhones)
                .Include(i => i.Addresses)
                    .ThenInclude(a => a.Province)
                .Include(i => i.Addresses)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(i => i.CustomerId == id);

            if (individual == null)
                return NotFound();

            var vm = MapToViewModel(individual);
            return Ok(vm);
        }

        #endregion

        #region POST

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CustomerIndividualViewModel vm)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!string.IsNullOrEmpty(vm.NationalCode))
            {
                if (await _context.CustomerIndividuals.AnyAsync(c => c.NationalCode == vm.NationalCode))
                {
                    ModelState.AddModelError(nameof(vm.NationalCode), "کد ملی قبلاً ثبت شده است.");
                    return BadRequest(ModelState);
                }
            }

            var individual = new CustomerIndividual
            {
                FirstName = vm.FirstName,
                LastName = vm.LastName,
                FatherName = vm.FatherName,
                BirthDate = vm.BirthDate,
                NationalCode = vm.NationalCode,
                IdentityNumber = vm.IdentityNumber,
                Gender = vm.Gender,
                MaritalStatus = vm.MaritalStatus
            };

            _context.CustomerIndividuals.Add(individual);
            await _context.SaveChangesAsync();

            await AddEmailsAsync(individual.CustomerId, vm.Emails);
            await AddPhonesAsync(individual.CustomerId, vm.ContactPhones);
            await AddAddressesAsync(individual.CustomerId, vm.Addresses);

            return Ok(individual.CustomerId);
        }

        #endregion

        #region PUT

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Edit(int id, [FromBody] CustomerIndividualViewModel vm)
        {
            if (id != vm.CustomerId)
                return BadRequest();

            var existing = await _context.CustomerIndividuals
                .Include(i => i.Emails)
                .Include(i => i.ContactPhones)
                .Include(i => i.Addresses)
                .FirstOrDefaultAsync(i => i.CustomerId == id);

            if (existing == null)
                return NotFound();

            if (!string.IsNullOrEmpty(vm.NationalCode))
            {
                if (await _context.CustomerIndividuals.AnyAsync(c => c.NationalCode == vm.NationalCode && c.CustomerId != id))
                {
                    ModelState.AddModelError(nameof(vm.NationalCode), "کد ملی قبلاً ثبت شده است.");
                    return BadRequest(ModelState);
                }
            }

            existing.FirstName = vm.FirstName;
            existing.LastName = vm.LastName;
            existing.FatherName = vm.FatherName;
            existing.BirthDate = vm.BirthDate;
            existing.NationalCode = vm.NationalCode;
            existing.IdentityNumber = vm.IdentityNumber;
            existing.Gender = vm.Gender;
            existing.MaritalStatus = vm.MaritalStatus;

            UpdateEmails(existing, vm.Emails);
            UpdatePhones(existing, vm.ContactPhones);
            await UpdateAddressesAsync(existing, vm.Addresses);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        #endregion

        #region DELETE

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var individual = await _context.CustomerIndividuals
                .Include(i => i.Emails)
                .Include(i => i.ContactPhones)
                .Include(i => i.Addresses)
                .FirstOrDefaultAsync(i => i.CustomerId == id);

            if (individual == null)
                return NotFound();

            if (individual.Emails.Any())
                _context.Emails.RemoveRange(individual.Emails);

            if (individual.ContactPhones.Any())
                _context.ContactPhones.RemoveRange(individual.ContactPhones);

            if (individual.Addresses.Any())
                _context.Addresses.RemoveRange(individual.Addresses);

            _context.CustomerIndividuals.Remove(individual);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Helpers

        private CustomerIndividualViewModel MapToViewModel(CustomerIndividual individual)
        {
            return new CustomerIndividualViewModel
            {
                CustomerId = individual.CustomerId,
                FirstName = individual.FirstName,
                LastName = individual.LastName,
                FatherName = individual.FatherName,
                BirthDate = individual.BirthDate,
                NationalCode = individual.NationalCode,
                IdentityNumber = individual.IdentityNumber,
                Gender = individual.Gender,
                MaritalStatus = individual.MaritalStatus,
                Emails = individual.Emails?.Select(e => new EmailViewModel
                {
                    EmailId = e.EmailId,
                    EmailAddress = e.EmailAddress,
                    EmailType = e.EmailType,
                    IsPrimary = e.IsPrimary
                }).ToList() ?? new List<EmailViewModel>(),
                ContactPhones = individual.ContactPhones?.Select(p => new PhoneViewModel
                {
                    PhoneId = p.PhoneId,
                    PhoneNumber = p.PhoneNumber,
                    PhoneType = p.PhoneType,
                    Extension = p.Extension
                }).ToList() ?? new List<PhoneViewModel>(),
                Addresses = individual.Addresses?.Select(a => new AddressViewModel
                {
                    AddressId = a.AddressId,
                    FullAddress = a.FullAddress,
                    ProvinceId = a.ProvinceId,
                    ProvinceName = a.Province?.Name,
                    CityId = a.CityId,
                    CityName = a.City?.Name,
                    PostalCode = a.PostalCode,
                    AddressType = a.AddressType
                }).ToList() ?? new List<AddressViewModel>()
            };
        }

        private async Task AddEmailsAsync(int individualId, List<EmailViewModel> emails)
        {
            var validEmails = emails?.Where(e => !string.IsNullOrWhiteSpace(e.EmailAddress))
                .Select(e => new Email
                {
                    IndividualCustomerId = individualId,
                    EmailAddress = e.EmailAddress,
                    EmailType = e.EmailType,
                    IsPrimary = e.IsPrimary
                }).ToList();

            if (validEmails?.Any() == true)
            {
                _context.Emails.AddRange(validEmails);
                await _context.SaveChangesAsync();
            }
        }

        private async Task AddPhonesAsync(int individualId, List<PhoneViewModel> phones)
        {
            var validPhones = phones?.Where(p => !string.IsNullOrWhiteSpace(p.PhoneNumber))
                .Select(p => new ContactPhone
                {
                    IndividualCustomerId = individualId,
                    PhoneNumber = p.PhoneNumber,
                    PhoneType = p.PhoneType,
                    Extension = p.Extension
                }).ToList();

            if (validPhones?.Any() == true)
            {
                _context.ContactPhones.AddRange(validPhones);
                await _context.SaveChangesAsync();
            }
        }

        private async Task AddAddressesAsync(int individualId, List<AddressViewModel> addresses)
        {
            var validAddresses = addresses?.Where(a => !string.IsNullOrWhiteSpace(a.FullAddress))
                .Select(a => new Address
                {
                    IndividualCustomerId = individualId,
                    AddressType = a.AddressType,
                    ProvinceId = a.ProvinceId,
                    CityId = a.CityId,
                    PostalCode = a.PostalCode,
                    FullAddress = a.FullAddress
                }).ToList();

            if (validAddresses?.Any() == true)
            {
                _context.Addresses.AddRange(validAddresses);
                await _context.SaveChangesAsync();
            }
        }

        private void UpdateEmails(CustomerIndividual existing, List<EmailViewModel> emails)
        {
            emails = emails ?? new List<EmailViewModel>();
            var toRemove = existing.Emails.Where(e => !emails.Any(vm => vm.EmailId == e.EmailId)).ToList();
            _context.Emails.RemoveRange(toRemove);

            foreach (var vm in emails)
            {
                if (vm.EmailId == null || vm.EmailId == 0)
                {
                    existing.Emails.Add(new Email
                    {
                        IndividualCustomerId = existing.CustomerId,
                        EmailAddress = vm.EmailAddress,
                        EmailType = vm.EmailType,
                        IsPrimary = vm.IsPrimary
                    });
                }
                else
                {
                    var email = existing.Emails.FirstOrDefault(e => e.EmailId == vm.EmailId);
                    if (email != null)
                    {
                        email.EmailAddress = vm.EmailAddress;
                        email.EmailType = vm.EmailType;
                        email.IsPrimary = vm.IsPrimary;
                    }
                    else
                    {
                        existing.Emails.Add(new Email
                        {
                            IndividualCustomerId = existing.CustomerId,
                            EmailAddress = vm.EmailAddress,
                            EmailType = vm.EmailType,
                            IsPrimary = vm.IsPrimary
                        });
                    }
                }
            }
        }

        private void UpdatePhones(CustomerIndividual existing, List<PhoneViewModel> phones)
        {
            phones = phones ?? new List<PhoneViewModel>();
            var toRemove = existing.ContactPhones.Where(p => !phones.Any(vm => vm.PhoneId == p.PhoneId)).ToList();
            _context.ContactPhones.RemoveRange(toRemove);

            foreach (var vm in phones)
            {
                if (vm.PhoneId == null || vm.PhoneId == 0)
                {
                    existing.ContactPhones.Add(new ContactPhone
                    {
                        IndividualCustomerId = existing.CustomerId,
                        PhoneNumber = vm.PhoneNumber,
                        PhoneType = vm.PhoneType,
                        Extension = vm.Extension
                    });
                }
                else
                {
                    var phone = existing.ContactPhones.FirstOrDefault(p => p.PhoneId == vm.PhoneId);
                    if (phone != null)
                    {
                        phone.PhoneNumber = vm.PhoneNumber;
                        phone.PhoneType = vm.PhoneType;
                        phone.Extension = vm.Extension;
                    }
                    else
                    {
                        existing.ContactPhones.Add(new ContactPhone
                        {
                            IndividualCustomerId = existing.CustomerId,
                            PhoneNumber = vm.PhoneNumber,
                            PhoneType = vm.PhoneType,
                            Extension = vm.Extension
                        });
                    }
                }
            }
        }

        private async Task UpdateAddressesAsync(CustomerIndividual existing, List<AddressViewModel> addresses)
        {
            addresses = addresses ?? new List<AddressViewModel>();
            var toRemove = existing.Addresses.Where(a => !addresses.Any(vm => vm.AddressId == a.AddressId)).ToList();
            _context.Addresses.RemoveRange(toRemove);

            foreach (var vm in addresses)
            {
                if (vm.AddressId == null || vm.AddressId == 0)
                {
                    var newAddress = new Address
                    {
                        IndividualCustomerId = existing.CustomerId,
                        AddressType = vm.AddressType,
                        ProvinceId = vm.ProvinceId,
                        CityId = vm.CityId,
                        PostalCode = vm.PostalCode,
                        FullAddress = vm.FullAddress
                    };
                    _context.Addresses.Add(newAddress);
                }
                else
                {
                    var address = existing.Addresses.FirstOrDefault(a => a.AddressId == vm.AddressId);
                    if (address != null)
                    {
                        address.AddressType = vm.AddressType;
                        address.ProvinceId = vm.ProvinceId;
                        address.CityId = vm.CityId;
                        address.PostalCode = vm.PostalCode;
                        address.FullAddress = vm.FullAddress;
                    }
                    else
                    {
                        var newAddress = new Address
                        {
                            IndividualCustomerId = existing.CustomerId,
                            AddressType = vm.AddressType,
                            ProvinceId = vm.ProvinceId,
                            CityId = vm.CityId,
                            PostalCode = vm.PostalCode,
                            FullAddress = vm.FullAddress
                        };
                        _context.Addresses.Add(newAddress);
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        #endregion
    }
}
