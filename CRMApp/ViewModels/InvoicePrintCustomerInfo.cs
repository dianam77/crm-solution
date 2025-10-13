namespace CRMApp.ViewModels
{
    public class InvoicePrintCustomerInfo
    {
        public string CustomerName { get; set; } = "-";
        public string? EconomicCode { get; set; }
        public string? RegisterOrNationalId { get; set; }
        public string FullAddress { get; set; } = "-";
        public string? Province { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
    }

}
