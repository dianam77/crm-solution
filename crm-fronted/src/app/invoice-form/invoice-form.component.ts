import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import moment from 'moment-jalaali';

import { CustomerCompany } from '../models/customer-company.model';
import { CustomerIndividual } from '../models/customer-individual.model';
import { Product } from '../models/product.model';
import { Invoice, InvoiceItem, InvoiceAttachment } from '../models/invoice.model';

import { InvoiceService } from '../services/invoice.service';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { CustomerCompanyService } from '../services/customer-company.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {

  invoice: Invoice = {
    invoiceNumber: '',
    invoiceType: 'Proforma',
    issueDate: new Date().toISOString(),
    invoiceItems: [],
    attachments: [],
    createdByUserId: '',
    totalAmount: 0,
    status: 'Draft'
  };

  deletedAttachments: InvoiceAttachment[] = [];
  validityDays: number | null = null;
  dueDateShamsi: string = '';

  customersIndividual: CustomerIndividual[] = [];
  customersCompany: CustomerCompany[] = [];
  products: Product[] = [];
  selectedCustomerType: 'individual' | 'company' | null = null;

  constructor(
    private invoiceService: InvoiceService,
    private customerIndividualService: CustomerIndividualService,
    private customerCompanyService: CustomerCompanyService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.invoice.createdByUserId =
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    } catch {
      this.router.navigate(['/login']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceService.getInvoice(+id).subscribe(res => {
        this.invoice = res;

        // بارگذاری فایل‌های موجود
        this.invoice.attachments = res.attachments?.map(a => ({
          id: a.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          description: ''
        })) ?? [];

        if (res.customerIndividualId) this.selectedCustomerType = 'individual';
        else if (res.customerCompanyId) this.selectedCustomerType = 'company';

        // محاسبه تعداد روز اعتبار
        if (res.dueDate && res.issueDate) {
          const issue = new Date(res.issueDate);
          const due = new Date(res.dueDate);
          this.validityDays = Math.ceil((due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
          this.dueDateShamsi = moment(due).format('jYYYY/jMM/jDD');
        }

        this.calculateTotal();
      });
    }

    this.customerIndividualService.getAll().subscribe(res => (this.customersIndividual = res));
    this.customerCompanyService.getAll().subscribe(res => (this.customersCompany = res));
    this.productService.getProducts().subscribe(res => (this.products = res));
  }

  /** افزودن آیتم جدید به فاکتور */
  addItem(): void {
    const lastItem = this.invoice.invoiceItems[this.invoice.invoiceItems.length - 1];
    if (lastItem && (!lastItem.productId || lastItem.quantity <= 0 || lastItem.unitPrice <= 0)) {
      alert('لطفاً ابتدا آیتم قبلی را کامل کنید.');
      return;
    }
    this.invoice.invoiceItems.push({
      productId: null,
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      priceAfterDiscount: 0,
      vatAmount: 0,
      finalPrice: 0
    });
  }

  /** حذف آیتم */
  removeItem(index: number): void {
    this.invoice.invoiceItems.splice(index, 1);
    this.calculateTotal();
  }

  /** تغییر محصول آیتم */
  onProductChange(item: InvoiceItem, productId: string | null): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      item.productId = product.id;
      item.unitPrice = product.price ?? 0;
    } else {
      item.productId = null;
      item.unitPrice = 0;
    }
    this.calculateTotal();
  }

  /** محاسبه جمع کل */
  calculateTotal(): number {
    let total = 0;
    this.invoice.invoiceItems.forEach(i => {
      const price = i.quantity * (i.unitPrice ?? 0);
      const discount = i.discount ?? 0;
      i.priceAfterDiscount = Math.max(price - discount, 0);
      i.vatAmount = i.priceAfterDiscount * 0.10;
      i.finalPrice = i.priceAfterDiscount + i.vatAmount;
      total += i.finalPrice;
    });
    this.invoice.totalAmount = total;
    return total;
  }

  /** جمع بدون مالیات */
  getTotalWithoutVAT(): number {
    return this.invoice.invoiceItems.reduce((sum, i) => sum + (i.priceAfterDiscount ?? 0), 0);
  }

  /** جمع کل مالیات */
  getTotalVAT(): number {
    return this.invoice.invoiceItems.reduce((sum, i) => sum + (i.vatAmount ?? 0), 0);
  }

  /** تغییر نوع مشتری */
  onCustomerTypeChange(type: 'individual' | 'company'): void {
    this.selectedCustomerType = type;
    if (type === 'individual') this.invoice.customerCompanyId = undefined;
    else this.invoice.customerIndividualId = undefined;
  }

  /** محاسبه تاریخ سررسید */
  onValidityDaysChange(): void {
    if (this.invoice.invoiceType === 'Proforma' && this.validityDays && this.validityDays > 0) {
      const issue = new Date(this.invoice.issueDate);
      issue.setDate(issue.getDate() + this.validityDays);
      this.invoice.dueDate = issue.toISOString();
      this.dueDateShamsi = moment(issue).format('jYYYY/jMM/jDD');
    } else {
      this.invoice.dueDate = undefined;
      this.dueDateShamsi = '';
    }
  }

  /** انتخاب فایل ضمیمه */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.invoice.attachments?.push({
        file,
        fileName: file.name,
        fileUrl: '',
        description: ''
      });
    }
    event.target.value = '';
  }

  /** حذف فایل ضمیمه */
  removeAttachment(index: number): void {
    const att = this.invoice.attachments?.[index];
    if (att && att.id) {
      this.deletedAttachments.push(att);
    }
    this.invoice.attachments?.splice(index, 1);
  }

  /** بازگشت به لیست فاکتورها */
  goToList(): void {
    this.router.navigate(['/invoices']);
  }

  /** ذخیره یا ویرایش فاکتور */
  save(): void {
    if (!this.selectedCustomerType) {
      alert('نوع مشتری را انتخاب کنید.');
      return;
    }
    if (!this.invoice.invoiceNumber || !this.invoice.invoiceType) {
      alert('شماره و نوع فاکتور الزامی است.');
      return;
    }
    if (!this.invoice.invoiceItems.length) {
      alert('حداقل یک آیتم باید اضافه شود.');
      return;
    }
    const invalidItem = this.invoice.invoiceItems.find(item => !item.productId);
    if (invalidItem) {
      alert('تمام آیتم‌ها باید محصول معتبر انتخاب شده داشته باشند.');
      return;
    }

    this.calculateTotal();

    const formData = new FormData();
    formData.append('InvoiceNumber', this.invoice.invoiceNumber ?? '');
    formData.append('InvoiceType', this.invoice.invoiceType ?? '');
    formData.append('Status', this.invoice.status ?? 'Draft');
    formData.append('IssueDate', this.invoice.issueDate ?? '');
    if (this.validityDays) formData.append('ValidityDays', this.validityDays.toString());
    if (this.invoice.dueDate) formData.append('DueDate', this.invoice.dueDate ?? '');
    if (this.invoice.customerIndividualId != null)
      formData.append('CustomerIndividualId', this.invoice.customerIndividualId.toString());
    if (this.invoice.customerCompanyId != null)
      formData.append('CustomerCompanyId', this.invoice.customerCompanyId.toString());
    if (this.invoice.notes) formData.append('Notes', this.invoice.notes ?? '');

    const itemsJson = JSON.stringify(
      this.invoice.invoiceItems.map(item => ({
        ProductId: item.productId,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        Discount: item.discount ?? 0,
        PriceAfterDiscount: item.priceAfterDiscount ?? 0,
        VATAmount: item.vatAmount ?? 0,
        FinalPrice: item.finalPrice ?? 0
      }))
    );
    formData.append('ItemsJson', itemsJson);

    // فایل‌های جدید
    this.invoice.attachments?.forEach(att => {
      if (att.file instanceof File)
        formData.append('attachments', att.file, att.file.name);
    });

    // فایل‌های موجود
    const existingIds = this.invoice.attachments?.filter(att => att.id).map(att => att.id).join(',');
    formData.append('ExistingAttachmentIds', existingIds ?? '');

    // فایل‌های حذف شده
    const deletedIds = this.deletedAttachments.map(a => a.id).join(',');
    formData.append('DeletedAttachmentIds', deletedIds);

    if (this.invoice.id) {
      this.invoiceService.updateInvoice(this.invoice.id, formData).subscribe({
        next: () => {
          alert('فاکتور ویرایش شد.');
          this.goToList();
        },
        error: err => alert('خطا در ویرایش: ' + JSON.stringify(err.error))
      });
    } else {
      this.invoiceService.createInvoice(formData).subscribe({
        next: () => {
          alert('فاکتور ثبت شد.');
          this.goToList();
        },
        error: err => alert('خطا در ثبت: ' + JSON.stringify(err.error))
      });
    }
  }
}
