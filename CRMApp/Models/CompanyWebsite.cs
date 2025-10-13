using CRMApp.Models;
using System.Text.Json.Serialization;

public class CompanyWebsite
{
    public int WebsiteId { get; set; }
    public string Url { get; set; }

    public int MainCompanyId { get; set; }

    [JsonIgnore] // ← این باعث می‌شود در POST/PUT ارسال نشود
    public MainCompany? MainCompany { get; set; }
}
