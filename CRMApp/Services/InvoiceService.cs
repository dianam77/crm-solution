using CRMApp.Data;
using CRMApp.Models;
using CRMApp.Models.Enums;
using CRMApp.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRMApp.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly CRMAppDbContext _context;

        public InvoiceService(CRMAppDbContext context)
        {
            _context = context;
        }

        public async Task<Invoice> CreateInvoiceAsync(Invoice invoice)
        {
     
            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            return invoice;
        }

        public async Task<Invoice?> GetInvoiceByIdAsync(int id)
        {
            return await _context.Invoices
                .Include(i => i.InvoiceItems)
                .Include(i => i.Attachments)
                .Include(i => i.CustomerIndividual)
                .Include(i => i.CustomerCompany)
                .Include(i => i.CreatedByUser)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task<IEnumerable<Invoice>> GetAllInvoicesAsync()
        {
            return await _context.Invoices
                .Include(i => i.CustomerIndividual)
                .Include(i => i.CustomerCompany)
                .ToListAsync();
        }

        public async Task<bool> UpdateInvoiceAsync(Invoice invoice)
        {
       
            _context.Invoices.Update(invoice);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteInvoiceAsync(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return false;

            _context.Invoices.Remove(invoice);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> ConvertToInvoiceAsync(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null || invoice.InvoiceType != InvoiceType.Proforma)
                return false;

  
            invoice.InvoiceType = InvoiceType.Invoice;
            invoice.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{invoice.Id}";
            invoice.Status = InvoiceStatus.Sent;


            invoice.DueDate = DateTime.UtcNow.AddDays(7);

   
            invoice.UpdatedAt = DateTime.UtcNow;


            return await _context.SaveChangesAsync() > 0;
        }

    }
}
