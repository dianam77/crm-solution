using CRMApp.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRMApp.Services.Interfaces
{
    public interface IInvoiceService
    {
        Task<Invoice> CreateInvoiceAsync(Invoice invoice);
        Task<Invoice?> GetInvoiceByIdAsync(int id);
        Task<IEnumerable<Invoice>> GetAllInvoicesAsync();
        Task<bool> UpdateInvoiceAsync(Invoice invoice);
        Task<bool> DeleteInvoiceAsync(int id);
        Task<bool> ConvertToInvoiceAsync(int id);
    }
}
