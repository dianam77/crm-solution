namespace CRMApp.Models
{
    public class ContactPhone
    {
        public int PhoneId { get; set; }

        public int? IndividualCustomerId { get; set; }
        public CustomerIndividual? IndividualCustomer { get; set; }

        public int? CompanyCustomerId { get; set; }
        public CustomerCompany? CompanyCustomer { get; set; }

        public int? MainCompanyId { get; set; }
        public MainCompany? MainCompany { get; set; }



        public string PhoneType { get; set; }
        public string PhoneNumber { get; set; }
        public string Extension { get; set; }
    }
}
