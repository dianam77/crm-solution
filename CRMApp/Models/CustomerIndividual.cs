using CRMApp.Validation;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.Models
{
    public class CustomerIndividual
    {
        public int CustomerId { get; set; }

        [Display(Name = "نام")]
        public string FirstName { get; set; } = string.Empty;

        [Display(Name = "نام خانوادگی")]
        public string LastName { get; set; } = string.Empty;

        [Display(Name = "نام پدر")]
        public string? FatherName { get; set; }

        [DataType(DataType.Date)]
        [Display(Name = "تاریخ تولد")]
        public DateTime? BirthDate { get; set; }

        [Display(Name = "کد ملی")]
        [UniqueNationalCode] 
        public string? NationalCode { get; set; }

        [Display(Name = "شماره شناسنامه")]
        public string? IdentityNumber { get; set; }

        [Display(Name = "جنسیت")]
        public string? Gender { get; set; }

        [Display(Name = "وضعیت تاهل")]
        public string? MaritalStatus { get; set; }

        public List<Address> Addresses { get; set; } = new List<Address>();
        public List<ContactPhone> ContactPhones { get; set; } = new List<ContactPhone>();
        public List<Email> Emails { get; set; } = new List<Email>();

        public ICollection<CustomerCompanyRelation> CustomerCompanyRelations { get; set; } = new List<CustomerCompanyRelation>();

        public string FullName => $"{FirstName} {LastName}".Trim();
    }
}
