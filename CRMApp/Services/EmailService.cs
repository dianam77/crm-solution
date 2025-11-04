using CRMApp.Models;
using CRMApp.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System;
using System.Threading.Tasks;

namespace CRMApp.Services
{
    public class EmailService : IEmailService
    {
        public EmailService()
        {
        }


        public async Task SendAsync(string to, string subject, string body, SmtpSettings smtpSettings)
        {
            if (smtpSettings == null)
                throw new ArgumentNullException(nameof(smtpSettings));

            if (!smtpSettings.IsActive)
                throw new InvalidOperationException("SMTP service is not active.");

            if (string.IsNullOrWhiteSpace(smtpSettings.SenderEmail) ||
                string.IsNullOrWhiteSpace(smtpSettings.SenderPassword) ||
                string.IsNullOrWhiteSpace(smtpSettings.SmtpServer))
            {
                throw new InvalidOperationException("SMTP settings are incomplete. لطفاً ایمیل، پسورد یا سرور را بررسی کنید.");
            }

            try
            {
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(
                    string.IsNullOrWhiteSpace(smtpSettings.DisplayName)
                        ? smtpSettings.SenderEmail
                        : smtpSettings.DisplayName,
                    smtpSettings.SenderEmail));

                email.To.Add(MailboxAddress.Parse(to));
                email.Subject = subject;
                email.Body = new TextPart("html") { Text = body };

                using var smtp = new SmtpClient();


                var socketOption = smtpSettings.EnableSsl
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.Auto;

                await smtp.ConnectAsync(smtpSettings.SmtpServer, smtpSettings.SmtpPort, socketOption);


                await smtp.AuthenticateAsync(smtpSettings.SenderEmail, smtpSettings.SenderPassword);

                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                Console.WriteLine($"✅ Email sent successfully to {to}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Failed to send email: {ex.Message}");
                throw new InvalidOperationException("خطا در ارسال ایمیل. لطفاً تنظیمات SMTP را بررسی کنید.", ex);
            }
        }
    }
}
