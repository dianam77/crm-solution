using System.Collections.Generic;

namespace CRMApp.DTOs
{
    public class MainCompanyDto
    {
        public int MainCompanyId { get; set; }
        public string CompanyName { get; set; } = "-";
        public string EconomicCode { get; set; } = "-";
        public string RegistrationNumber { get; set; } = "-";
        public List<EmailDto> Emails { get; set; } = new();
        public List<ContactPhoneDto> ContactPhones { get; set; } = new();
        public List<AddressDto> Addresses { get; set; } = new();
        public List<CompanyWebsiteDto> Websites { get; set; } = new();
    }

    public class EmailDto
    {
        public int EmailId { get; set; }
        public string EmailAddress { get; set; } = "-";
        public string EmailType { get; set; } = "-";
        public bool IsPrimary { get; set; }
    }

    public class ContactPhoneDto
    {
        public int PhoneId { get; set; }
        public string PhoneNumber { get; set; } = "-";
        public string PhoneType { get; set; } = "-";
        public string Extension { get; set; } = "-";
    }

    public class AddressDto
    {
        public int AddressId { get; set; }
        public string FullAddress { get; set; } = "-";
        public int ProvinceId { get; set; }
        public string ProvinceName { get; set; } = "-";
        public int CityId { get; set; }
        public string CityName { get; set; } = "-";
        public string PostalCode { get; set; } = "-";
        public string AddressType { get; set; } = "-";
    }

    public class CompanyWebsiteDto
    {
        public int WebsiteId { get; set; }
        public string Url { get; set; } = "-";
    }
}
