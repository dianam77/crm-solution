using System;

namespace CRMApp.Models
{
    public class CustomerCompanyRelation
    {
        public int RelationId { get; set; }

        public int? IndividualCustomerId { get; set; }

        public CustomerIndividual? IndividualCustomer { get; set; } 

        public int? CompanyCustomerId { get; set; }
        public CustomerCompany? CompanyCustomer { get; set; } 

        public string? RelationType { get; set; }
        public DateTime? StartDate { get; set; }
        public string? Description { get; set; }
    }
}

