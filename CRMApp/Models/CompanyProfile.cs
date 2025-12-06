namespace CRMApp.Models
{
    public class CompanyProfile
    {
        public int Id { get; set; } // همیشه یک رکورد

        // اطلاعات پایه شرکت
        public string CompanyName { get; set; }          // نام شرکت
        public string? EconomicCode { get; set; }        // کد اقتصادی
        public string? NationalId { get; set; }          // شناسه ملی
        public string? RegisterNumber { get; set; }      // شماره ثبت
        public DateTime? EstablishmentDate { get; set; } // تاریخ تأسیس
        public string? IndustryField { get; set; }       // حوزه فعالیت
        public string? Website { get; set; }             // وبسایت (اختیاری)

        // لیست‌های مرتبط
        public List<Address> Addresses { get; set; } = new();
        public List<ContactPhone> ContactPhones { get; set; } = new();
        public List<Email> Emails { get; set; } = new();
    }



}
