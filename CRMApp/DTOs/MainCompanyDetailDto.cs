using CRMApp.Models;

namespace CRMApp.DTOs
{
    public class MainCompanyDetailDto
    {
        public int MainCompanyId { get; set; }
        public string CompanyName { get; set; }
        public string EconomicCode { get; set; }
        public string RegistrationNumber { get; set; }

        public ICollection<Email> Emails { get; set; } = new List<Email>();
        public ICollection<ContactPhone> ContactPhones { get; set; } = new List<ContactPhone>();
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<CompanyWebsite> Websites { get; set; } = new List<CompanyWebsite>();
    }

}
