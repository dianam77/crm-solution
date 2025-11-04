using CRMApp.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRMApp.ViewModels
{
    public class CompanyCreateViewModel
    {
        
        [Required(ErrorMessage = "نام شرکت الزامی است.")]
        public string CompanyName { get; set; }


        public string? EconomicCode { get; set; }
        public string? NationalId { get; set; }
        public string? RegisterNumber { get; set; }
        public DateTime? EstablishmentDate { get; set; }
        public string? IndustryField { get; set; }
        public string? Website { get; set; }

        public int? SelectedIndividualCustomerId { get; set; }
        public string? RelationType { get; set; }
        public DateTime? RelationStartDate { get; set; }
        public string? RelationDescription { get; set; }

        public List<EmailViewModel> Emails { get; set; } = new();
        public List<PhoneViewModel> ContactPhones { get; set; } = new();
        public List<AddressViewModel> Addresses { get; set; } = new();

    
        public List<IndividualCustomer> IndividualCustomers { get; set; } = new();
    }

    public class IndividualCustomer
    {
        public int CustomerId { get; set; }
        public string FullName { get; set; }
    }
}
