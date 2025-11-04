import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import moment from 'moment-jalaali';

import { InvoiceService } from '../services/invoice.service';
import { Invoice, InvoiceType } from '../models/invoice.model';
import { jwtDecode } from 'jwt-decode';

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
    moment.loadPersian({ usePersianDigits: true });
    this.loadInvoices();
  }
  selectedInvoiceAttachments: any[] = [];
  showAttachmentsModal = false;

  openAttachmentsModal(invoice: any): void {
    this.selectedInvoiceAttachments = invoice.attachments || [];
    this.showAttachmentsModal = true;
  }

  closeAttachmentsModal(): void {
    this.showAttachmentsModal = false;
  }
  getAttachmentUrl(filePath: string): string {
    if (!filePath) return '#';


    const baseUrl = 'https://localhost:44386'; 
    return filePath.startsWith('http') ? filePath : `${baseUrl}/${filePath}`;
  }
  toPersianDigits(value: any): string {
    if (value === null || value === undefined) return '-';
    const str = value.toString();
    return str.replace(/\d/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
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



  getInvoiceTotalVAT(invoice: any): number {
    return invoice.invoiceItems?.reduce((sum: number, item: any) => sum + (item.vatAmount ?? 0), 0) ?? 0;
  }


  getInvoiceFinalTotal(invoice: any): number {
    return invoice.invoiceItems?.reduce((sum: number, item: any) => sum + (item.finalPrice ?? 0), 0) ?? 0;
  }

  
  getInvoiceValidityDays(invoice: any): string {
    return invoice.validityDays != null ? invoice.validityDays.toString() : '-';
  }

  getInvoiceAttachments(invoice: any): string {
    if (!invoice.attachments?.length) return '-';
    return invoice.attachments.map((a: any) => a.fileName).join(', ');
  }
  hasPermission(permission: string): boolean {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const permsRaw = decoded['permissions'] || '[]';
      const userPermissions: string[] = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());
      return userPermissions.includes(permission.toLowerCase());
    } catch (err) {
      console.error('JWT decode error:', err);
      return false;
    }
  }
  
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
