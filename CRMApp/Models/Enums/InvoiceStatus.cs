namespace CRMApp.Models.Enums
{
    public enum InvoiceStatus
    {
        Draft = 0,     // پیش نویس
        Sent = 1,      // ارسال شده
        Approved = 2,  // تایید شده
        Paid = 3,      // پرداخت شده
        Canceled = 4   // لغو شده
    }
}
