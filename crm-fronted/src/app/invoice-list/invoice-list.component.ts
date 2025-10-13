import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import moment from 'moment-jalaali';

import { InvoiceService } from '../services/invoice.service';
import { Invoice, InvoiceType } from '../models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  filtersOpen: boolean = false;
  filterCustomerType: 'All' | 'Individual' | 'Company' = 'All';

  constructor(
    private invoiceService: InvoiceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getInvoices().subscribe({
      next: (res) => {
        this.invoices = res;
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  goToCreate(): void {
    this.router.navigate(['/invoices/create']);
  }

  goToEdit(id: number): void {
    this.router.navigate([`/invoices/edit/${id}`]);
  }

  onDelete(id: number): void {
    if (!confirm('آیا از حذف این فاکتور مطمئن هستید؟')) return;

    this.invoiceService.deleteInvoice(id).subscribe({
      next: () => {
        alert('فاکتور با موفقیت حذف شد.');
        this.loadInvoices();
      },
      error: (err) => alert('خطا در حذف فاکتور: ' + err.message)
    });
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  applyFilter(): void {
    this.filteredInvoices = this.invoices
      .filter(i => {
        if (this.filterCustomerType === 'Individual' && !i.customerIndividualId) return false;
        if (this.filterCustomerType === 'Company' && !i.customerCompanyId) return false;
        return true;
      })
      .filter(i => {
        if (!this.searchTerm) return true;
        const term = this.searchTerm.toLowerCase();
        return i.invoiceNumber.toLowerCase().includes(term) ||
          (i.customerIndividual?.fullName?.toLowerCase().includes(term) ?? false) ||
          (i.customerCompany?.companyName?.toLowerCase().includes(term) ?? false);
      });
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'Draft': return 'پیش‌نویس';
      case 'Sent': return 'ارسال شده';
      case 'Paid': return 'پرداخت شده';
      case 'Cancelled': return 'لغو شده';
      default: return '-';
    }
  }

  getCustomerName(invoice: Invoice): string {
    if (invoice.customerIndividual) return invoice.customerIndividual.fullName ?? '-';
    if (invoice.customerCompany) return invoice.customerCompany.companyName ?? '-';
    return '-';
  }

  formatDate(dateStr?: string): string {
    return dateStr ? moment(dateStr).format('jYYYY/jMM/jDD') : '-';
  }

  toJalali(dateStr?: string): string {
    return this.formatDate(dateStr);
  }
  getInvoiceTotalAfterDiscount(invoice: any): number {
    return invoice.invoiceItems?.reduce((sum: number, item: any) => sum + (item.priceAfterDiscount ?? 0), 0) ?? 0;
  }
  getValidityDays(invoice: Invoice): number {
    if (!invoice.issueDate || !invoice.dueDate) return 0;
    const issue = new Date(invoice.issueDate).getTime();
    const due = new Date(invoice.dueDate).getTime();
    return Math.ceil((due - issue) / (1000 * 60 * 60 * 24));
  }


  // جمع VAT تمام آیتم‌ها
  getInvoiceTotalVAT(invoice: any): number {
    return invoice.invoiceItems?.reduce((sum: number, item: any) => sum + (item.vatAmount ?? 0), 0) ?? 0;
  }

  // جمع نهایی تمام آیتم‌ها
  getInvoiceFinalTotal(invoice: any): number {
    return invoice.invoiceItems?.reduce((sum: number, item: any) => sum + (item.finalPrice ?? 0), 0) ?? 0;
  }

  // تعداد روز اعتبار
  getInvoiceValidityDays(invoice: any): string {
    return invoice.validityDays != null ? invoice.validityDays.toString() : '-';
  }

  // نمایش پیوست‌ها
  getInvoiceAttachments(invoice: any): string {
    if (!invoice.attachments?.length) return '-';
    return invoice.attachments.map((a: any) => a.fileName).join(', ');
  }

  // چاپ یک فاکتور
  printInvoice(id: number): void {
    this.invoiceService.getInvoicePdf(id).subscribe({
      next: (res: Blob) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        console.error('خطا در دریافت PDF:', err);

        // اگر پاسخ سرور شامل متن باشد، آن را بخوانید
        if (err.error instanceof Blob && err.error.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = () => {
            console.error('متن خطای سرور:', reader.result);
            alert('خطای سرور: ' + reader.result);
          };
          reader.readAsText(err.error);
        } else {
          alert('خطا در دریافت PDF: ' + (err.message || JSON.stringify(err)));
        }
      }
    });
  }



  getInvoiceTypeLabel(type?: InvoiceType): string {
    switch (type) {
      case 'Proforma':
        return 'پیش‌فاکتور';
      case 'Invoice':
        return 'فاکتور';
      default:
        return '-';
    }
  }



}
