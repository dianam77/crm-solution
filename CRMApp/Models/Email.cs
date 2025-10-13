using System.ComponentModel.DataAnnotations;

namespace CRMApp.Models
{
    public class Email
    {
        public int EmailId { get; set; }

        public int? IndividualCustomerId { get; set; }
        public CustomerIndividual? IndividualCustomer { get; set; }

        public int? CompanyCustomerId { get; set; }
        public CustomerCompany? CompanyCustomer { get; set; }

        public int? MainCompanyId { get; set; }
        public MainCompany? MainCompany { get; set; }



        [Required]
        [EmailAddress(ErrorMessage = "فرمت ایمیل معتبر نیست.")]
        public string EmailAddress { get; set; }

        public string EmailType { get; set; }

        public bool IsPrimary { get; set; }
    }
}

