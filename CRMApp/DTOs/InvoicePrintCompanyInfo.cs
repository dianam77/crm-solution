namespace CRMApp.DTOs
{
    public class InvoicePrintCustomerInfo
    {
        public string CustomerName { get; set; } = "-";
        public string RegisterOrNationalId { get; set; } = "-";
        public string EconomicCode { get; set; } = "-";
        public string FullAddress { get; set; } = "-";
        public string Province { get; set; } = "-";
        public string City { get; set; } = "-";
        public string PostalCode { get; set; } = "-";
    }

    public class InvoicePrintCompanyInfo
    {
        public string CompanyName { get; set; } = "-";
        public string EconomicCode { get; set; } = "-";
        public string RegistrationNumber { get; set; } = "-";
        public string Emails { get; set; } = "-";
        public string ContactPhones { get; set; } = "-";
        public string Addresses { get; set; } = "-";
        public string Websites { get; set; } = "-";

        // اضافه کردن اطلاعات آدرس
        public string Province { get; set; } = "-";
        public string City { get; set; } = "-";
        public string PostalCode { get; set; } = "-";
        public string FullAddress { get; set; } = "-";
    }
}
