using System.ComponentModel.DataAnnotations;
using System.Linq;
using CRMApp.Data;

namespace CRMApp.Validation
{
    public class UniqueNationalCodeAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null) return ValidationResult.Success;

            var context = (CRMAppDbContext)validationContext.GetService(typeof(CRMAppDbContext))!;
            var instance = (Models.CustomerIndividual)validationContext.ObjectInstance;

            bool exists = context.CustomerIndividuals
                .Any(c => c.NationalCode == value.ToString() && c.CustomerId != instance.CustomerId);

            if (exists)
                return new ValidationResult("این کد ملی قبلاً ثبت شده است.");

            return ValidationResult.Success;
        }
    }
}
