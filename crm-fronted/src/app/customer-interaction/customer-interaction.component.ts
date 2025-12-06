import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import moment from 'moment-jalaali';
import { forkJoin } from 'rxjs';
import { NgPersianDatepickerModule } from 'ng-persian-datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import jwtDecode  from 'jwt-decode';
import { NgSelectModule } from '@ng-select/ng-select';

import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { CustomerInteractionService } from '../services/customer-interaction.service';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { CustomerCompanyService } from '../services/customer-company.service';
import { AuthService } from '../services/auth.service';

import { CustomerInteraction } from '../models/customer-interaction.model';
import { CustomerIndividual } from '../models/customer-individual.model';
import { CustomerCompany } from '../models/customer-company.model';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';
import { CustomerInteractionAttachment } from '../models/CustomerInteractionAttachment';
import { Router } from '@angular/router';
interface ConflictInfo {
  customerFullName: string;
  ownerName: string;
}

@Component({
  selector: 'app-customer-interaction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgPersianDatepickerModule,
    NgxMaterialTimepickerModule,
    NgSelectModule
  ],
  templateUrl: './customer-interaction.component.html',
  styleUrls: ['./customer-interaction.component.css']
})
export class CustomerInteractionComponent implements OnInit {
  form: FormGroup;
  interactions: CustomerInteraction[] = [];
  individualCustomers: CustomerIndividual[] = [];
  companyCustomers: CustomerCompany[] = [];
  showModal = false;
  selectedCustomerType: 'individual' | 'company' = 'individual';

  interactionTypes = [
    { value: 0, label: 'تماس تلفنی', key: 'Call' },
    { value: 1, label: 'جلسه', key: 'Meeting' },
    { value: 2, label: 'ایمیل', key: 'Email' },
    { value: 3, label: 'پیامک', key: 'SMS' },
    { value: 4, label: 'یادداشت', key: 'Note' }
  ];

  isEditMode = false;
  editingInteractionId: number | null = null;
  currentUserName = '';
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  allProducts: Product[] = [];

  currentAttachmentFiles: { file: File, originalName: string }[] = [];
  existingAttachments: { filePath: string; originalName: string }[] = [];

  formattedTime = '';
  timeFormat: '12' | '24' = '24';
  amPm: 'AM' | 'PM' = 'AM';
  permissions: string[] = [];

  // برای هر گروه فیلتر محصولات
  filteredProductsByGroup: Product[][] = [];
    customerInteractionService: any;

  constructor(
    private fb: FormBuilder,
    private interactionService: CustomerInteractionService,
    private individualService: CustomerIndividualService,
    private companyService: CustomerCompanyService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService,
    private router: Router,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      interactionType: [0, Validators.required],
      startDateTime: ['', Validators.required],
      startTime: ['', Validators.required],
      durationMinutes: ['', [Validators.pattern(/^\d+$/)]],
      individualCustomerId: [null],
      companyCustomerId: [null],
      subject: [''],
      notes: [''],
      categoryProductGroups: this.fb.array([
        this.fb.group({
          categoryIds: [[], Validators.required],
          productIds: [[], Validators.required]
        })
      ])
    });
  }
  

  get categoryProductGroups(): FormArray {
    return this.form.get('categoryProductGroups') as FormArray;
  }

  // برای هماهنگی نام فرم در برخی نقاط
  get categoryProductFormArray(): FormArray {
    return this.form.get('categoryProductGroups') as FormArray;
  }

  addCategoryProductGroup(): void {
    const group = this.fb.group({
      categoryIds: [[]],
      productIds: [[]]
    });
    this.categoryProductGroups.push(group);
    this.filteredProductsByGroup.push([]);
  }

  removeCategoryProductGroup(index: number): void {
    this.categoryProductGroups.removeAt(index);
    this.filteredProductsByGroup.splice(index, 1);
  }

  onCategoryChange(index: number): void {
    const selectedIds = this.categoryProductGroups.at(index).get('categoryIds')?.value || [];
    // فرض بر این است که Product.categoryId نوعش string یا number است و قابل includes است
    this.filteredProductsByGroup[index] = this.allProducts.filter(p => selectedIds.includes(p.categoryId));
    this.categoryProductGroups.at(index).patchValue({ productIds: [] });
  }

  ngOnInit(): void {
    this.currentUserName = this.authService.getCurrentUserName() || '';
    this.authService.currentUser$.subscribe(name => this.currentUserName = name || '');
    this.loadPermissions();

    // 🔹 چاپ JWT و نقش‌ها برای دیباگ
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log("📌 JWT Payload:", decoded);

        // بررسی نقش‌ها و دسترسی‌ها
        if (decoded.permissions) {
          const perms = Array.isArray(decoded.permissions)
            ? decoded.permissions
            : JSON.parse(decoded.permissions);
          console.log("📌 Permissions:", perms);
        }

        if (decoded.role) {
          console.log("📌 Role:", decoded.role);
        }
      } catch (err) {
        console.error("❌ JWT decode error:", err);
      }
    }

    // بارگذاری اولیه داده‌ها
    forkJoin({
      individual: this.individualService.getAll(),
      company: this.companyService.getAll(),
      categories: this.categoryService.getCategories(),
      products: this.productService.getProducts()
    }).subscribe({
      next: ({ individual, company, categories, products }) => {
        this.individualCustomers = individual;
        this.companyCustomers = company;
        this.categories = categories;
        this.allProducts = products;
        this.filteredProducts = [];
        this.filteredProductsByGroup = this.categoryProductGroups.controls.map(_ => []);
        this.loadInteractions();

        // subscribe روی انتخاب مشتری برای بررسی تعامل فعال
        this.form.get('individualCustomerId')?.valueChanges.subscribe(id => {
          if (id) this.checkActiveInteraction(id);
        });

        this.form.get('companyCustomerId')?.valueChanges.subscribe(id => {
          if (id) this.checkActiveInteraction(id);
        });
      },
      error: err => console.error(err)
    });
  }



  private loadPermissions() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const permsRaw = decoded['permissions'] || '[]';
      this.permissions = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());
    } catch (err) {
      console.error('JWT decode error:', err);
      this.permissions = [];
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission.toLowerCase());
  }
  loadInteractions(): void {
    // 🔹 چاپ payload JWT برای دیباگ
    const token = localStorage.getItem('jwtToken');
    const payload = token ? this.authService['decodeToken'](token) : null;
    console.log("📌 JWT PAYLOAD:", payload);
    console.log("📌 ROLE:", this.authService.getRole());
    console.log("📌 PERMISSIONS:", this.authService.getPermissions());

    // 🔹 چک permission واقعی برای دیدن همه تعاملات
    const hasGetAll = this.authService.hasPermission('customerinteraction.getall');
    console.log("📌 HAS customerinteraction.getall ?", hasGetAll);

    // 🔹 انتخاب متد مناسب
    const request$ = hasGetAll
      ? this.interactionService.getAll()
      : this.interactionService.getMyInteractions();

    request$.subscribe({
      next: (res: any[]) => {
        this.interactions = res.map((i: any) => {
          // تبدیل نوع تعامل
          let typeKey: number | undefined;
          if (typeof i.interactionType === 'string') {
            const parsed = Number(i.interactionType);
            typeKey = isNaN(parsed) ? undefined : parsed;
          } else if (typeof i.interactionType === 'number') {
            typeKey = i.interactionType;
          } else {
            typeKey = undefined;
          }
          i.interactionType = typeKey;

          // پردازش مشتری
          i.customer = i.individualCustomerId
            ? this.individualCustomers.find((c: any) => c.customerId === i.individualCustomerId)
            : i.companyCustomerId
              ? this.companyCustomers.find((c: any) => c.customerId === i.companyCustomerId)
              : undefined;

          // نام محصولات
          i.productName = i.productIds
            ?.map((pid: number) => this.allProducts.find((p: any) => p.id === pid)?.name || '')
            .filter((n: string) => n);

          // نام دسته‌بندی‌ها
          i.categoryName = i.categoryIds
            ?.map((cid: number) => this.categories.find((c: any) => c.id === cid)?.name || '')
            .filter((n: string) => n);

          // اسامی انجام‌دهنده‌ها
          i.performedByName = i.performedByName?.trim() || this.currentUserName || '-';
          i.createdByName = i.createdByName?.trim() || '-';
          i.currentOwnerName = i.currentOwnerName?.trim() || '-';

          // وضعیت
          const status = i.isActive ? 'فعال' : 'غیرفعال';

          return { ...i, status };
        });
      },
      error: (err: any) => {
        console.error('Error loading interactions:', err);
      }
    });
  }





  selectCustomerType(type: 'individual' | 'company') {
    this.selectedCustomerType = type;
    if (type === 'individual') this.form.patchValue({ companyCustomerId: null });
    else this.form.patchValue({ individualCustomerId: null });
  }

  getStartDateTimeISO(): string {
    const startDate = this.form.get('startDateTime')?.value;
    const startTime = this.form.get('startTime')?.value;
    if (!startDate || !startTime) return '';

    const cleanDate = startDate.trim().replace(/[-.]/g, '/');
    const cleanTime = this.normalizeTime(startTime);
    const dateTime = `${cleanDate} ${cleanTime}`;
    const m = moment(dateTime, 'jYYYY/jMM/jDD HH:mm', true);

    if (!m.isValid()) {
      alert('لطفاً تاریخ و ساعت شروع را به درستی وارد کنید.');
      return '';
    }

    return m.locale('en').format('YYYY-MM-DDTHH:mm:ss');
  }

  private normalizeTime(time: string): string {
    if (!time) return '';
    let cleanTime = time.trim().replace(/\s?(AM|PM)$/i, '');
    const parts = cleanTime.split(':');
    if (parts.length === 2) {
      const hour = parts[0].padStart(2, '0');
      const minute = parts[1].padStart(2, '0');
      cleanTime = `${hour}:${minute}`;
    }
    return cleanTime;
  }

  calculateEndDate(): string | undefined {
    const startISO = this.getStartDateTimeISO();
    const duration = Number(this.form.get('durationMinutes')?.value);

    if (!startISO || isNaN(duration) || duration <= 0) return undefined;

    // محاسبه EndDateTime
    const endISO = moment(startISO, 'YYYY-MM-DDTHH:mm:ss', true)
      .add(duration, 'minutes')
      .format('YYYY-MM-DDTHH:mm:ss');

    // تبدیل اعداد فارسی به انگلیسی
    const toEnglishNumbers = (input: string) =>
      input.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));

    return toEnglishNumbers(endISO);
  }


  onTimeTextChange(value: string): void {
    const normalized = this.normalizeTime(value);
    if (!normalized) return;
    this.formattedTime = normalized;
    this.form.patchValue({ startTime: normalized });
  }

  onInteractionTypeChange(): void {
    const type = this.form.get('interactionType')?.value;
    if (![0, 1].includes(type)) this.form.patchValue({ durationMinutes: null });
    if (this.isEditMode && this.editingInteractionId !== null) {
      this.interactions = this.interactions.map(i =>
        i.id === this.editingInteractionId
          ? { ...i, durationMinutes: [0, 1].includes(type) ? i.durationMinutes : undefined, endDateTime: [0, 1].includes(type) ? i.endDateTime : undefined }
          : i
      );
      this.cdr.detectChanges();
    }
  }

  onDurationChange(): void { this.updateInteractionEndDate(); }
  isDurationEnabled(): boolean { const type = Number(this.form.get('interactionType')?.value); return [0, 1].includes(type); }

  submit(): void {
    if (this.form.invalid) {
      alert('لطفاً تمام فیلدهای ضروری را تکمیل کنید.');
      return;
    }

    const formData = new FormData();

    // Helper: تبدیل اعداد فارسی به انگلیسی
    const toEnglishNumbers = (input: string) =>
      input.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));

    // Interaction Type
    const interactionType = this.form.get('interactionType')?.value;
    if (interactionType != null) formData.append('InteractionType', interactionType.toString());

    // Start DateTime
    const startDateISO = this.getStartDateTimeISO();
    if (!startDateISO) {
      alert('لطفاً تاریخ و ساعت شروع را به درستی وارد کنید.');
      return;
    }
    formData.append('StartDateTime', toEnglishNumbers(startDateISO));

    // Duration & EndDateTime
    const duration = Number(this.form.get('durationMinutes')?.value);
    if (!isNaN(duration) && duration > 0) {
      formData.append('DurationMinutes', duration.toString());
      const endDateISO = toEnglishNumbers(
        moment(startDateISO, 'YYYY-MM-DDTHH:mm:ss', true)
          .add(duration, 'minutes')
          .format('YYYY-MM-DDTHH:mm:ss')
      );
      formData.append('EndDateTime', endDateISO);
    }

    // Subject & Notes
    const subject = this.form.get('subject')?.value;
    const notes = this.form.get('notes')?.value;
    if (subject) formData.append('Subject', subject);
    if (notes) formData.append('Notes', notes);

    // Category/Product groups
    const categoryProductGroups = this.form.get('categoryProductGroups') as FormArray;
    if (categoryProductGroups?.length) {
      const combinedData = categoryProductGroups.controls.map(group => {
        const cats: string[] = (group.get('categoryIds')?.value || []).map((c: any) => c.toString());
        const prods: string[] = (group.get('productIds')?.value || []).map((p: any) => p.toString());
        return { CategoryIds: cats, ProductIds: prods };
      });
      formData.append('CategoryProductGroupsJson', JSON.stringify(combinedData));
    }

    // Customer selection
    if (this.selectedCustomerType === 'individual') {
      const id = this.form.get('individualCustomerId')?.value;
      if (id != null) formData.append('IndividualCustomerId', id.toString());
    } else if (this.selectedCustomerType === 'company') {
      const id = this.form.get('companyCustomerId')?.value;
      if (id != null) formData.append('CompanyCustomerId', id.toString());
    }

    // New files
    this.currentAttachmentFiles.forEach(f => {
      if (f.file && f.originalName) {
        formData.append('attachments', f.file, f.originalName);
      }
    });

    // Existing attachments
    if (this.existingAttachments?.length) {
      const existingPaths = this.existingAttachments.map(f => f.filePath).join(',');
      formData.append('ExistingAttachmentPaths', existingPaths);
    }

    // Debug payload
    console.log('📦 Payload Sent to Backend:', Object.fromEntries(formData.entries()));

    // Send request
    const request = this.isEditMode && this.editingInteractionId != null
      ? this.interactionService.update(this.editingInteractionId, formData)
      : this.interactionService.create(formData);

    request.subscribe({
      next: () => {
        this.loadInteractions();
        this.resetForm();
        alert('✅ تعامل با موفقیت ثبت شد');
      },
      error: err => {
        console.error('❌ خطا در ذخیره تعامل:', err);
        alert('خطایی در ذخیره اطلاعات رخ داد.');
      }
    });
  }
  async checkActiveInteraction(customerId: number): Promise<ConflictInfo | null> {
    return new Promise((resolve) => {
      this.interactionService.getActiveByCustomer(customerId).subscribe({
        next: (res: any) => {
          console.log('🔹 API Response:', res);

          if (res.conflict && res.conflictingInteractions?.length > 0) {
            const conflict = res.conflictingInteractions[0];

            const currentUserId = String(this.authService.getCurrentUserId() || '').trim().toLowerCase();
            const ownerId = String(conflict.currentOwnerId || '').trim().toLowerCase();

            if (ownerId && ownerId !== currentUserId) {
              const conflictInfo: ConflictInfo = {
                customerFullName: conflict.customerFullName || 'نامشخص',
                ownerName: conflict.currentOwnerFullName || 'نامشخص'
              };
              resolve(conflictInfo);
              return;
            }
          }

          resolve(null); // اگر تعارضی نیست
        },
        error: (err) => {
          console.error('خطا در بررسی تعامل فعال:', err);
          resolve(null); // در صورت خطا اجازه ادامه بده
        }
      });
    });
  }


  onCustomerSelect(customerType: 'individual' | 'company') {
    const customerId = customerType === 'individual'
      ? this.form.get('individualCustomerId')?.value
      : this.form.get('companyCustomerId')?.value;

    if (!customerId) return;

    this.checkActiveInteraction(customerId).then(conflict => {
      if (conflict) {
        // اجازه بده Angular ابتدا انتخاب را ثبت کند
        setTimeout(() => {
          this.zone.run(() => {
            const message = `⚠️ مشتری «${conflict.customerFullName}» در حال حاضر توسط کاربر «${conflict.ownerName}» در تعامل فعال قرار دارد.\n\nآیا می‌خواهید ادامه دهید؟`;
            const proceed = window.confirm(message);

            if (!proceed) {
              // کاربر رد کرد → انتخاب را پاک کن
              if (customerType === 'individual') {
                this.form.patchValue({ individualCustomerId: null });
              } else {
                this.form.patchValue({ companyCustomerId: null });
              }
            }
          });
        }, 0);
      }
    });
  }




  // نمایش پیوست‌ها
  selectedAttachments: CustomerInteractionAttachment[] = [];
  showAttachmentsModal = false;

  openAttachmentsModal(interaction: CustomerInteraction, event?: Event): void {
    if (event) event.preventDefault();
    this.selectedAttachments = interaction.attachments || [];
    this.showAttachmentsModal = true;
  }

  editInteraction(i: CustomerInteraction): void {
    this.isEditMode = true;
    this.editingInteractionId = i.id ?? null;

    // تبدیل اعداد فارسی به انگلیسی
    const toEnglishNumbers = (input: string) =>
      input.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));

    let startDate = '';
    let startTime = '';

    if (i.startDateTime) {
      const m = moment(i.startDateTime);
      startDate = toEnglishNumbers(m.format('jYYYY/jMM/jDD'));
      startTime = toEnglishNumbers(m.format('HH:mm'));
    }

    this.form.patchValue({
      interactionType: Number(i.interactionType),
      startDateTime: startDate,
      startTime: startTime,
      durationMinutes: [0, 1].includes(Number(i.interactionType)) ? i.durationMinutes ?? null : null,
      subject: i.subject ?? '',
      notes: i.notes ?? '',
      individualCustomerId: i.individualCustomerId ?? null,
      companyCustomerId: i.companyCustomerId ?? null
    });

    // خالی‌سازی فرم آرایه گروه‌ها
    while (this.categoryProductGroups.length) {
      this.categoryProductGroups.removeAt(0);
    }
    this.filteredProductsByGroup = [];

    if (i.categoryIds && i.categoryIds.length > 0) {
      i.categoryIds.forEach(catId => {
        const filteredProducts = this.allProducts.filter(p => p.categoryId === catId);
        this.filteredProductsByGroup.push(filteredProducts);

        const selectedProductIds = i.productIds?.filter(pid => filteredProducts.some(p => p.id === pid)) || [];

        const group = this.fb.group({
          categoryIds: [[catId]],
          productIds: [selectedProductIds]
        });

        this.categoryProductGroups.push(group);
      });
    }

    this.formattedTime = startTime;

    this.existingAttachments = i.attachments?.map(a => ({
      filePath: a.filePath ?? '',
      originalName: a.originalName ?? (a.filePath?.split('/').pop() ?? '')
    })) ?? [];

    this.currentAttachmentFiles = [];

    this.cdr.detectChanges();
    this.showModal = true;
  }


  updateInteractionEndDate(): void {
    if (this.isEditMode && this.editingInteractionId !== null) {
      const interaction = this.interactions.find(i => i.id === this.editingInteractionId);
      if (!interaction) return;

      const duration = Number(this.form.get('durationMinutes')?.value);
      if (!isNaN(duration) && duration > 0) {
        interaction.durationMinutes = duration;
        interaction.endDateTime = moment(this.getStartDateTimeISO()).add(duration, 'minutes').toISOString();
      } else {
        interaction.durationMinutes = undefined;
        interaction.endDateTime = undefined;
      }
      this.interactions = [...this.interactions];
    }
  }

  deleteInteraction(id: number): void {
    if (!confirm('آیا از حذف این تعامل اطمینان دارید؟')) return;
    this.interactionService.delete(id).subscribe(() => {
      this.interactions = this.interactions.filter(i => i.id !== id);
    }, err => {
      console.error('Error deleting interaction:', err);
      alert('خطا در حذف تعامل.');
    });
  }

  resetForm(): void {
    this.showModal = false;

    this.form.reset({
      interactionType: undefined,
      startDateTime: '',
      startTime: '',
      durationMinutes: undefined,
      individualCustomerId: undefined,
      companyCustomerId: undefined,
      subject: '',
      notes: ''
    });

    // بازنشانی آرایه گروه‌ها به حالت اولیه (یک گروه خالی)
    while (this.categoryProductGroups.length) {
      this.categoryProductGroups.removeAt(0);
    }
    this.addCategoryProductGroup();

    this.isEditMode = false;
    this.editingInteractionId = null;

    this.currentAttachmentFiles = [];
    this.existingAttachments = [];

    this.formattedTime = '';
    this.interactions = [...this.interactions];
  }

  toJalali(dateStr?: string): string {
    if (!dateStr) return '-';
    const m = moment(dateStr);
    return m.isValid() ? m.format('jYYYY/jMM/jDD HH:mm') : '-';
  }

  checkNumber(event: any) {
    const value = event.target.value;
    if (value && !/^\d+$/.test(value)) {
      alert('لطفاً فقط عدد وارد کنید!');
      event.target.value = '';
    }
  }
  
  getInteractionLabel(type: number | string | undefined): string {
    if (type === undefined || type === null || type === '') return '-';

    const asNumber = Number(type);
    if (!isNaN(asNumber)) {
      const t = this.interactionTypes.find(x => x.value === asNumber);
      if (t) return t.label;
    }

    if (typeof type === 'string') {
      const t = this.interactionTypes.find(x => x.key.toLowerCase() === type.toLowerCase());
      if (t) return t.label;
    }

    return '-';
  }


  getAttachmentUrl(path?: string): string {
    return path ? `https://localhost:44386${path}` : '';
  }

  getCustomerDisplayName(customer: CustomerIndividual | CustomerCompany | undefined): string {
    if (!customer) return '-';
    if ('fullName' in customer) return customer.fullName || '-';
    if ('companyName' in customer) return customer.companyName || '-';
    return '-';
  }

  onFileChange(event: any): void {
    const files: FileList = event.target.files;
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > maxSizeBytes) {
          alert(`⚠️ فایل "${file.name}" بیش از ${maxSizeMB} مگابایت حجم دارد و اضافه نمی‌شود.`);
          continue;
        }

        // بررسی تکراری بودن بر اساس نام فایل
        const isDuplicate =
          this.currentAttachmentFiles.some(f => f.file.name === file.name) ||
          this.existingAttachments.some(f => f.originalName === file.name);

        if (isDuplicate) {
          alert(`⚠️ فایل "${file.name}" قبلاً اضافه شده است.`);
          continue;
        }

        this.currentAttachmentFiles.push({ file, originalName: file.name });
      }
    }

    // پاک‌سازی input تا دوباره بتوان همان فایل را انتخاب کرد
    event.target.value = '';
  }

  addFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  removeExistingAttachment(index: number): void {
    if (index >= 0 && index < this.existingAttachments.length) {
      this.existingAttachments.splice(index, 1);
    }
  }

  toPersianDigits(value: any): string {
    if (value === null || value === undefined) return '-';
    return value.toString().replace(/[0-9]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  }

  removeNewAttachment(index: number): void {
    if (index >= 0 && index < this.currentAttachmentFiles.length) {
      this.currentAttachmentFiles.splice(index, 1);
    }
  }

  isArray(value: any): value is any[] {
    return Array.isArray(value);
  }

  getCategoryProductPairs(i: CustomerInteraction): { category: string; products: string[] }[] {
    if (!i.categoryName || i.categoryName.length === 0) return [];

    const pairs: { category: string; products: string[] }[] = [];

    // اطمینان از اینکه categoryName و productName آرایه هستند
    const categories: string[] = Array.isArray(i.categoryName) ? i.categoryName : [i.categoryName];
    const products: string[] = Array.isArray(i.productName) ? i.productName : (i.productName ? [i.productName] : []);

    categories.forEach((category: string) => {
      const productsForCategory = products.filter((pName: string) => {
        const product = this.allProducts.find(p => p.name === pName);
        const categoryObj = this.categories.find(c => c.name === category);
        return product?.categoryId === categoryObj?.id;
      });

  
pairs.push({
  category,
  products: productsForCategory
});


    });

    return pairs;
  }


  selectedCategoryProducts: { category: string; products: string[] }[] = [];
  showCategoryModal = false;

  openCategoryModal(interaction: CustomerInteraction, event?: Event): void {
    if (event) event.preventDefault();
    this.selectedCategoryProducts = this.getCategoryProductPairs(interaction);
    this.showCategoryModal = true;
  }

  onFormatChange(value: '12' | '24'): void { this.timeFormat = value; }
  onAmPmChange(value: 'AM' | 'PM'): void { this.amPm = value; }


  goToReferral(interactionId: number) {
    this.router.navigate([`/customer-interaction/${interactionId}/details`]);
  }
  showIsActiveModal = false;
  selectedIsActive: boolean = false;
  editingActiveId: number | null = null;

  openIsActiveModal(interaction: CustomerInteraction) {
    this.editingActiveId = interaction.id!;
    this.selectedIsActive = interaction.isActive ?? false;
    this.showIsActiveModal = true;
  }

  closeIsActiveModal() {
    this.showIsActiveModal = false;
    this.editingActiveId = null;
  }
  saveIsActive() {
    if (this.editingActiveId === null) return;

    // مقدار selectedIsActive الان حتما Boolean است
    const activeValue: boolean = this.selectedIsActive;

    this.interactionService.updateIsActive(this.editingActiveId, activeValue)
      .subscribe({
        next: () => {
          // آپدیت سریع UI بدون reload
          const interaction = this.interactions.find(i => i.id === this.editingActiveId);
          if (interaction) interaction.isActive = activeValue;

          this.closeIsActiveModal();
          alert("وضعیت با موفقیت به‌روزرسانی شد.");
        },
        error: err => {
          console.error(err);
          alert("خطا در تغییر وضعیت.");
        }
      });
  }



  canRefer(interaction: CustomerInteraction): boolean {
    const currentUserId = String(this.authService.getCurrentUserId()).trim().toLowerCase();
    const isOwnerOrAssigned =
      String(interaction.currentOwnerId).trim().toLowerCase() === currentUserId ||
      String(interaction.performedById).trim().toLowerCase() === currentUserId;

    const hasReferralPermission = this.hasPermission('customerinteractionreferral.createreferral');

    return isOwnerOrAssigned && hasReferralPermission;
  }



}
