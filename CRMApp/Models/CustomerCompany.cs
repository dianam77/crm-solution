using System;
using System.Collections.Generic;

namespace CRMApp.Models
{
    public class CustomerCompany
    {
        public int CustomerId { get; set; }
        public string CompanyName { get; set; }
        public string? EconomicCode { get; set; }
        public string? NationalId { get; set; }
        public string? RegisterNumber { get; set; }
        public DateTime? EstablishmentDate { get; set; }
        public string? IndustryField { get; set; }
        public string? Website { get; set; }

        public List<CustomerCompanyRelation> CustomerCompanyRelations { get; set; } = new List<CustomerCompanyRelation>();
        public List<Address> Addresses { get; set; } = new List<Address>();
        public List<ContactPhone> ContactPhones { get; set; } = new List<ContactPhone>();
        public List<Email> Emails { get; set; } = new List<Email>();
    }
}
