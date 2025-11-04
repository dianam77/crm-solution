using CRMApp.Models;

namespace CRMApp.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendAsync(string to, string subject, string body, SmtpSettings smtpSettings);
    }
}
