using CRMApp.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.ViewModels
{
    public class CompanyCreateViewModel
    {
        // فقط نام شرکت اجباری است
        [Required(ErrorMessage = "نام شرکت الزامی است.")]
        public string CompanyName { get; set; }

        // بقیه فیلدها nullable هستند
        public string? EconomicCode { get; set; }
        public string? NationalId { get; set; }
        public string? RegisterNumber { get; set; }
        public DateTime? EstablishmentDate { get; set; }
        public string? IndustryField { get; set; }
        public string? Website { get; set; }

        // رابطه با مشتری حقیقی (همه nullable)
        public int? SelectedIndividualCustomerId { get; set; }
        public string? RelationType { get; set; }
        public DateTime? RelationStartDate { get; set; }
        public string? RelationDescription { get; set; }

        public List<EmailViewModel> Emails { get; set; } = new();
        public List<PhoneViewModel> ContactPhones { get; set; } = new();
        public List<AddressViewModel> Addresses { get; set; } = new();

        // لیست مشتریان حقیقی برای نمایش در dropdown
        public List<IndividualCustomer> IndividualCustomers { get; set; } = new();
    }

    public class IndividualCustomer
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; }
    }
}
