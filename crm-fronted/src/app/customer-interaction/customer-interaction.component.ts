import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import moment from 'moment-jalaali';
import { forkJoin } from 'rxjs';
import { NgPersianDatepickerModule } from 'ng-persian-datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import jwtDecode from 'jwt-decode';
import { NgSelectModule } from '@ng-select/ng-select';

import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { CustomerInteractionService } from '../services/customer-interaction.service';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { CustomerCompanyService } from '../services/customer-company.service';
import { AuthService } from '../services/auth.service';
import { FilterByCustomerPipe } from '../pipe/filter-by-customer.pipe';
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
  ownerId: string | number; // ⛔ اجباری
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
    NgSelectModule,
    
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
  uniqueCustomers: any[] = [];
  openedCustomerId: number | null = null;

  isEditMode = false;
  editingInteractionId: number | null = null;
  currentUserName = '';
  categories: Category[] = [];
  filteredProducts: Product[] = [];
  allProducts: Product[] = [];
  filteredProductsByGroup: Product[][] = [];

  currentAttachmentFiles: { file: File, originalName: string }[] = [];
  existingAttachments: { filePath: string; originalName: string }[] = [];

  formattedTime = '';
  timeFormat: '12' | '24' = '24';
  amPm: 'AM' | 'PM' = 'AM';
  permissions: string[] = [];

  selectedAttachments: CustomerInteractionAttachment[] = [];
  showAttachmentsModal = false;

  selectedCategoryProducts: { category: string; products: string[] }[] = [];
  showCategoryModal = false;
  openModal() {
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    document.body.style.overflow = 'auto';
  }

  showIsActiveModal = false;
  selectedIsActive: boolean = false;
  editingActiveId: number | null = null;

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

  get categoryProductFormArray(): FormArray {
    return this.form.get('categoryProductGroups') as FormArray;
  }

  addCategoryProductGroup(): void {
    const group = this.fb.group({ categoryIds: [[]], productIds: [[]] });
    this.categoryProductGroups.push(group);
    this.filteredProductsByGroup.push([]);
  }

  removeCategoryProductGroup(index: number): void {
    this.categoryProductGroups.removeAt(index);
    this.filteredProductsByGroup.splice(index, 1);
  }

  onCategoryChange(index: number): void {
    const selectedIds: string[] = this.categoryProductGroups.at(index).get('categoryIds')?.value || [];

    // بررسی دسته‌بندی‌های تکراری
    const allOtherSelectedIds: string[] = this.categoryProductGroups.controls
      .filter((_, i: number) => i !== index)   // همه گروه‌ها به جز این گروه
      .flatMap(g => g.get('categoryIds')?.value || []);

    const duplicates: string[] = selectedIds.filter((id: string) => allOtherSelectedIds.includes(id));

    if (duplicates.length > 0) {
      // پاک کردن دسته‌های تکراری
      this.categoryProductGroups.at(index).patchValue({
        categoryIds: selectedIds.filter((id: string) => !duplicates.includes(id)),
        productIds: []
      });

      // نمایش پیغام کاربر پسند
      alert(`دسته‌بندی "${duplicates.map((d: string) => this.getCategoryNameById(d)).join(', ')}" قبلاً انتخاب شده است.`);
      return;
    }

    // فیلتر محصولات بر اساس دسته‌بندی‌های انتخاب شده
    this.filteredProductsByGroup[index] = this.allProducts.filter(
      p => p.categoryId && selectedIds.includes(p.categoryId)
    );


    // پاک کردن محصولات قبلی
    this.categoryProductGroups.at(index).patchValue({ productIds: [] });
  }

  // متد کمکی برای گرفتن نام دسته‌بندی از id
  getCategoryNameById(id: string): string {
    const category = this.categories.find(c => c.id === id);
    return category ? category.name : id;
  }


  ngOnInit(): void {
    this.currentUserName = this.authService.getCurrentUserName() || '';
    this.authService.currentUser$.subscribe(name => this.currentUserName = name || '');
    // بعد از بارگذاری یا فیلتر کردن تعاملات فراخوانی کنید
    this.updateHasAnyOperation();
    this.loadPermissions();

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
        this.filteredProductsByGroup = this.categoryProductGroups.controls.map(_ => []);

        this.loadInteractions();

        // 🔹 نسخه نهایی valueChanges که alert همیشه نمایش داده شود
        this.form.get('individualCustomerId')?.valueChanges.subscribe(id => {
          if (id != null) {
            // حتی اگر همان مشتری دوباره انتخاب شود، بررسی شود
            setTimeout(() => this.onCustomerSelect('individual'), 0);
          }
        });

        this.form.get('companyCustomerId')?.valueChanges.subscribe(id => {
          if (id != null) {
            setTimeout(() => this.onCustomerSelect('company'), 0);
          }
        });
      },
      error: err => console.error(err)
    });
  }


  showInteractionsModal = false;
  selectedCustomer: any = null;
  filteredInteractions: any[] = [];

  openCustomerInteractionsModal(customer: any) {
    this.selectedCustomer = customer;

    this.filteredInteractions = this.interactions.filter(i =>
      customer.customerType === 'individual'
        ? i.individualCustomerId === customer.customerId
        : i.companyCustomerId === customer.customerId
    );

    this.showInteractionsModal = true;
    this.updateHasAnyOperation();
  }
  getFirstInteractionByCustomer(customer: any) {
    return this.interactions.find(i =>
      customer.customerType === 'individual'
        ? i.individualCustomerId === customer.customerId
        : i.companyCustomerId === customer.customerId
    );
  }


  closeInteractionsModal() {
    this.showInteractionsModal = false;
    this.selectedCustomer = null;
    this.filteredInteractions = [];
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
    // 🔹 دیباگ JWT
    const token = localStorage.getItem('jwtToken');
    const payload = token ? this.authService['decodeToken'](token) : null;
    console.log("📌 JWT PAYLOAD:", payload);
    console.log("📌 ROLE:", this.authService.getRole());
    console.log("📌 PERMISSIONS:", this.authService.getPermissions());

    // 🔹 چک دسترسی برای دریافت همه تعاملات
    const hasGetAllPermission = this.authService.hasPermission('customerinteraction.getall');
    console.log("📌 HAS customerinteraction.getall ?", hasGetAllPermission);

    // 🔹 انتخاب سرویس درست
    const request$ = hasGetAllPermission
      ? this.interactionService.getAll()
      : this.interactionService.getMyInteractions();

    request$.subscribe({
      next: (res: any[]) => {
        this.interactions = res.map((i: any) => {

          // 🔹 تبدیل interactionType به عدد
          let typeKey: number | undefined;
          if (typeof i.interactionType === 'string') {
            const parsed = Number(i.interactionType);
            typeKey = isNaN(parsed) ? undefined : parsed;
          } else {
            typeKey = i.interactionType;
          }
          i.interactionType = typeKey;

          // 🔹 Resolve مشتری حقیقی یا حقوقی
          const customer =
            i.individualCustomerId
              ? this.individualCustomers.find((c: any) => c.customerId === i.individualCustomerId)
              : i.companyCustomerId
                ? this.companyCustomers.find((c: any) => c.customerId === i.companyCustomerId)
                : null;

          // 🔹 محصول‌ها
          const productNameList = i.productIds?.length
            ? i.productIds
              .map((pid: number) => this.allProducts.find((p: any) => p.id === pid)?.name)
              .filter(Boolean)
            : [];

          // 🔹 دسته‌بندی‌ها
          const categoryNameList = i.categoryIds?.length
            ? i.categoryIds
              .map((cid: number) => this.categories.find((c: any) => c.id === cid)?.name)
              .filter(Boolean)
            : [];

          return {
            ...i,
            customer,
            productName: productNameList,
            categoryName: categoryNameList,
            performedByName: i.performedByName?.trim() || this.currentUserName || '-',
            createdByName: i.createdByName?.trim() || '-',
            currentOwnerName: i.currentOwnerName?.trim() || '-',
            isActive: i.isActive,
            status: i.isActive ? 'فعال' : 'غیرفعال'
          };
        });

        // 🔥 مهم‌ترین نکته: پر کردن مشتری‌ها بعد از لود interactions
        this.uniqueCustomers = this.getUniqueCustomers();
        console.log("📌 UNIQUE CUSTOMERS:", this.uniqueCustomers);
      },

      error: (err: any) => {
        console.error("❌ Error loading interactions:", err);
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
    if (!m.isValid()) { alert('لطفاً تاریخ و ساعت شروع را به درستی وارد کنید.'); return ''; }
    return m.locale('en').format('YYYY-MM-DDTHH:mm:ss');
  }

  private normalizeTime(time: string): string {
    if (!time) return '';
    let cleanTime = time.trim().replace(/\s?(AM|PM)$/i, '');
    const parts = cleanTime.split(':');
    if (parts.length === 2) cleanTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
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
  onDurationChange(): void { this.updateInteractionEndDate(); }
  isDurationEnabled(): boolean { const type = Number(this.form.get('interactionType')?.value); return [0, 1].includes(type); }
  submit(): void {
    if (this.form.invalid) {
      alert('لطفاً تمام فیلدهای ضروری را تکمیل کنید.');
      return;
    }

    const formData = new FormData();

    const toEnglishNumbers = (input: string) =>
      input.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));

    // InteractionType
    const interactionType = this.form.get('interactionType')?.value;
    if (interactionType != null) formData.append('InteractionType', interactionType.toString());

    // StartDateTime
    const startDateISO = this.getStartDateTimeISO();
    if (!startDateISO) { alert('لطفاً تاریخ و ساعت شروع را به درستی وارد کنید.'); return; }
    formData.append('StartDateTime', toEnglishNumbers(startDateISO));

    // Duration & EndDateTime
    const duration = Number(this.form.get('durationMinutes')?.value);
    if (!isNaN(duration) && duration > 0) {
      formData.append('DurationMinutes', duration.toString());
      const endDateISO = toEnglishNumbers(moment(startDateISO).add(duration, 'minutes').format('YYYY-MM-DDTHH:mm:ss'));
      formData.append('EndDateTime', endDateISO);
    }

    // Subject & Notes
    const subject = this.form.get('subject')?.value;
    const notes = this.form.get('notes')?.value;
    if (subject) formData.append('Subject', subject);
    if (notes) formData.append('Notes', notes);

    // Customer
    if (this.selectedCustomerType === 'individual') {
      const id = this.form.get('individualCustomerId')?.value;
      if (id != null) formData.append('IndividualCustomerId', id.toString());
    } else {
      const id = this.form.get('companyCustomerId')?.value;
      if (id != null) formData.append('CompanyCustomerId', id.toString());
    }

    // Category & Product Groups
    const groups = this.form.get('categoryProductGroups') as FormArray;
    if (groups?.length) {
      const combinedData = groups.controls.map(g => ({
        CategoryIds: (g.get('categoryIds')?.value || []).map((c: any) => c.toString()),
        ProductIds: (g.get('productIds')?.value || []).map((p: any) => p.toString())
      }));
      formData.append('CategoryProductGroupsJson', JSON.stringify(combinedData));
    }

    // فایل‌های جدید
    this.currentAttachmentFiles.forEach(f => {
      if (f.file && f.originalName) formData.append('attachments', f.file, f.originalName);
    });

    // فایل‌های موجود (در آپدیت)
    if (this.existingAttachments?.length) {
      const existingPaths = this.existingAttachments.map(f => f.filePath).join(',');
      formData.append('ExistingAttachmentPaths', existingPaths);
    }

    // ارسال درخواست
    const request$ = this.isEditMode && this.editingInteractionId != null
      ? this.interactionService.update(this.editingInteractionId, formData)
      : this.interactionService.create(formData);

    request$.subscribe({
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


  async checkActiveInteraction(
    customerId: number,
    customerType: 'individual' | 'company'
  ): Promise<ConflictInfo[]> {
    const res: any = await this.interactionService
      .getActiveByCustomer(customerId, customerType)
      .toPromise();

    if (!res?.conflict) return [];

    return res.conflictingInteractions.map((conflict: any) => ({
      customerFullName: conflict.customerFullName,
      ownerName: conflict.currentOwnerFullName,
      ownerId: conflict.currentOwnerId
    }));
  }


  onCustomerSelect(type: 'individual' | 'company') {
    // ❌ فقط در حالت ساخت
    if (this.isEditMode) return;

    const control = type === 'individual'
      ? this.form.get('individualCustomerId')
      : this.form.get('companyCustomerId');

    const customerId = control?.value;
    if (!customerId) return;

    const currentUserId = String(this.authService.getCurrentUserId());

    this.checkActiveInteraction(customerId, type).then(conflicts => {
      const invalidConflict = conflicts.find(c =>
        String(c.ownerId) !== currentUserId
      );

      if (invalidConflict) {
        alert(
          `⚠️ مشتری «${invalidConflict.customerFullName}» در حال حاضر در تعامل فعال با ` +
          `«${invalidConflict.ownerName}» است و نمی‌تواند انتخاب شود.`
        );

        // پاک کردن انتخاب بدون loop
        control?.setValue(null, { emitEvent: false });
      }
    });
  }





  editingTargetOwnerId: string | number | null = null; // 🔹 در کلاس تعریف شود

  editInteraction(i: CustomerInteraction): void {
    this.isEditMode = true;
    this.editingInteractionId = i.id ?? null;

    // ✅ تعیین نوع مشتری برای نمایش صحیح select
    if (i.companyCustomerId) {
      this.selectedCustomerType = 'company';
    } else if (i.individualCustomerId) {
      this.selectedCustomerType = 'individual';
    }

    // ذخیره صاحب واقعی تعامل
    this.editingTargetOwnerId = i.currentOwnerId ?? null;

    const toEnglishNumbers = (input: string) =>
      input.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));

    let startDate = '', startTime = '';
    if (i.startDateTime) {
      const m = moment(i.startDateTime);
      startDate = toEnglishNumbers(m.format('jYYYY/jMM/jDD'));
      startTime = toEnglishNumbers(m.format('HH:mm'));
    }

    this.form.patchValue({
      interactionType: Number(i.interactionType),
      startDateTime: startDate,
      startTime: startTime,
      durationMinutes: [0, 1].includes(Number(i.interactionType))
        ? i.durationMinutes ?? null
        : null,
      subject: i.subject ?? '',
      notes: i.notes ?? '',
      individualCustomerId: i.individualCustomerId ?? null,
      companyCustomerId: i.companyCustomerId ?? null
    });

    // 🔹 غیرفعال کردن انتخاب مشتری در حالت ویرایش
    this.form.get('individualCustomerId')?.disable({ emitEvent: false });
    this.form.get('companyCustomerId')?.disable({ emitEvent: false });

    // ریست دسته‌بندی و محصول
    while (this.categoryProductGroups.length) {
      this.categoryProductGroups.removeAt(0);
    }
    this.filteredProductsByGroup = [];

    if (i.categoryIds?.length) {
      i.categoryIds.forEach(catId => {
        const filteredProducts = this.allProducts.filter(p => p.categoryId === catId);
        this.filteredProductsByGroup.push(filteredProducts);

        const selectedProductIds =
          i.productIds?.filter(pid => filteredProducts.some(p => p.id === pid)) || [];

        this.categoryProductGroups.push(
          this.fb.group({
            categoryIds: [[catId]],
            productIds: [selectedProductIds]
          })
        );
      });
    }

    // فایل‌ها
    this.formattedTime = startTime;
    this.existingAttachments =
      i.attachments?.map(a => ({
        filePath: a.filePath ?? '',
        originalName: a.originalName ?? (a.filePath?.split('/').pop() ?? '')
      })) ?? [];

    this.currentAttachmentFiles = [];

    // نمایش مودال
    this.cdr.detectChanges();
    this.showModal = true;
  }



  deleteInteraction(id: number): void {
    if (!confirm('آیا از حذف این تعامل اطمینان دارید؟')) return;

    this.interactionService.delete(id).subscribe({
      next: () => {
        // حذف تعامل از لیست محلی
        this.interactions = this.interactions.filter(i => i.id !== id);

        // به‌روزرسانی مشتریان یکتا
        this.uniqueCustomers = this.getUniqueCustomers();

        // اگر مودال تعاملات باز است، فیلتر تعاملات مشتری را بروزرسانی کن
        if (this.showInteractionsModal && this.selectedCustomer) {
          this.filteredInteractions = this.interactions.filter(i =>
            this.selectedCustomer.customerType === 'individual'
              ? i.individualCustomerId === this.selectedCustomer.customerId
              : i.companyCustomerId === this.selectedCustomer.customerId
          );

          // اگر دیگر تعاملی برای مشتری وجود ندارد، مودال را ببند
          if (this.filteredInteractions.length === 0) {
            this.closeInteractionsModal();
          }
        }
        alert('تعامل با موفقیت حذف شد.');
      },
      error: err => {
        console.error('Error deleting interaction:', err);
        alert('خطا در حذف تعامل.');
      }
    });
  }

  resetForm(): void {
    // 🔹 فعال کردن انتخاب مشتری هنگام ریست فرم
    this.form.get('individualCustomerId')?.enable({ emitEvent: false });
    this.form.get('companyCustomerId')?.enable({ emitEvent: false });

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

    while (this.categoryProductGroups.length) this.categoryProductGroups.removeAt(0);
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
  removeExistingAttachment(index: number): void {
    if (index >= 0 && index < this.existingAttachments.length) this.existingAttachments.splice(index, 1);
  }
  removeNewAttachment(index: number): void {
    if (index >= 0 && index < this.currentAttachmentFiles.length) this.currentAttachmentFiles.splice(index, 1);
  }
  isArray(value: any): value is any[] {
    return Array.isArray(value);
  }
  getCategoryProductPairs(i: CustomerInteraction): { category: string; products: string[] }[] {
    if (!i.categoryName || i.categoryName.length === 0) return [];
    const pairs: { category: string; products: string[] }[] = [];
    const categories: string[] = Array.isArray(i.categoryName) ? i.categoryName : [i.categoryName];
    const products: string[] = Array.isArray(i.productName) ? i.productName : (i.productName ? [i.productName] : []);
    categories.forEach(category => {
      const productsForCategory = products.filter(pName => {
        const product = this.allProducts.find(p => p.name === pName);
        const categoryObj = this.categories.find(c => c.name === category);
        return product?.categoryId === categoryObj?.id;
      });
      pairs.push({ category, products: productsForCategory });
    });
    return pairs;
  }
  openCategoryModal(interaction: CustomerInteraction, event?: Event): void {
    if (event) event.preventDefault();
    this.selectedCategoryProducts = this.getCategoryProductPairs(interaction);
    this.showCategoryModal = true;
  }
  onFormatChange(value: '12' | '24'): void { this.timeFormat = value; }
  onAmPmChange(value: 'AM' | 'PM'): void { this.amPm = value; }
  goToReferral(interactionId: number) {
    const interaction = this.interactions.find(i => i.id === interactionId);
    if (!interaction || !interaction.customer) {
      alert('⚠️ مشتری یا تعامل یافت نشد.');
      return;
    }

    const customer = interaction.customer;

    // استخراج شناسه و نوع مشتری
    let customerId: number | undefined;
    let customerType: 'individual' | 'company' | undefined;

    if ('customerId' in customer) { // مشتری حقیقی
      customerId = customer.customerId;
      customerType = 'individual';
    } else if ('companyId' in customer || 'companyName' in customer) { // مشتری حقوقی
      customerId = ('customerId' in customer) ? customer.customerId : undefined;
      customerType = 'company';
    }

    if (!customerId || !customerType) {
      alert('❌ customerId پیدا نشد.');
      return;
    }

    // جمع‌آوری تمام تعامل‌های همان مشتری
    const customerInteractions = this.interactions
      .filter(i => {
        if (!i.customer) return false;
        const typeCheck = i.individualCustomerId && customerType === 'individual'
          ? i.individualCustomerId === customerId
          : i.companyCustomerId && customerType === 'company'
            ? i.companyCustomerId === customerId
            : false;
        return typeCheck;
      })
      .map(i => i.id);

    if (customerInteractions.length === 0) {
      alert('⚠️ تعاملی برای این مشتری یافت نشد.');
      return;
    }

    // ارسال به صفحه ارجاع با تمام تعامل‌ها
    this.router.navigate([`/customer-interaction/referral`], {
      queryParams: {
        customerId,
        customerType,
        interactionIds: customerInteractions.join(',')
      }
    });
  }

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
    const activeValue: boolean = this.selectedIsActive;
    this.interactionService.updateIsActive(this.editingActiveId, activeValue).subscribe({
      next: () => {
        const interaction = this.interactions.find(i => i.id === this.editingActiveId);
        if (interaction) interaction.isActive = activeValue;
        this.closeIsActiveModal();
        alert("وضعیت با موفقیت به‌روزرسانی شد.");
      },
      error: err => { console.error(err); alert("خطا در تغییر وضعیت."); }
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
  openAttachmentsModal(interaction: CustomerInteraction, event?: Event): void {
    if (event) event.preventDefault();
    this.selectedAttachments = interaction.attachments || [];
    this.showAttachmentsModal = true;
  }
  getCustomerDisplayName(customer: CustomerIndividual | CustomerCompany | undefined): string {
    if (!customer) return '-';
    if ('fullName' in customer) return customer.fullName || '-';
    if ('companyName' in customer) return customer.companyName || '-';
    return '-';
  }

  // حداکثر تعداد فایل مجاز
  readonly MAX_FILES = 5;
  // حداکثر حجم هر فایل به بایت (مثلاً 5MB)
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  onFileChange(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // بررسی تعداد کل فایل‌ها
      if (this.currentAttachmentFiles.length >= this.MAX_FILES) {
        alert(`⚠️ شما نمی‌توانید بیش از ${this.MAX_FILES} فایل انتخاب کنید.`);
        break; // دیگر فایل‌ها اضافه نشوند
      }

      // بررسی حجم فایل
      if (file.size > this.MAX_FILE_SIZE) {
        alert(`⚠️ حجم فایل "${file.name}" بیش از حد مجاز (${this.MAX_FILE_SIZE / (1024 * 1024)}MB) است.`);
        continue; // این فایل را اضافه نکن
      }

      // اضافه کردن فایل
      this.currentAttachmentFiles.push({ file, originalName: file.name });
    }
  }

  get selectedIndividualCustomerName(): string {
    const id = this.form.get('individualCustomerId')?.value;
    if (!id) return '-';
    const customer = this.individualCustomers.find(c => c.customerId === id);
    return customer?.fullName || '-';
  }

  get selectedCompanyCustomerName(): string {
    const id = this.form.get('companyCustomerId')?.value;
    if (!id) return '-';
    const customer = this.companyCustomers.find(c => c.customerId === id);
    return customer?.companyName || '-';
  }


  addFileInput(fileInput: HTMLInputElement) {
    fileInput.click();
  }
  getSelectedCustomerName(): string {
    if (!this.isEditMode) return '-';

    if (this.selectedCustomerType === 'individual') {
      const customerId = this.form.get('individualCustomerId')?.value;
      const customer = this.individualCustomers.find(c => c.customerId === customerId);
      return customer?.fullName || '-';
    } else {
      const customerId = this.form.get('companyCustomerId')?.value;
      const customer = this.companyCustomers.find(c => c.customerId === customerId);
      return customer?.companyName || '-';
    }
  }


  getUniqueCustomers() {
    const map = new Map<string, any>();

    this.interactions.forEach(i => {
      if (!i.customer) return;

      const type = i.individualCustomerId ? 'individual' : 'company';
      const key = `${type}-${i.customer.customerId}`;

      if (!map.has(key)) {
        map.set(key, {
          ...i.customer,
          customerId: i.customer.customerId,
          customerType: type
        });
      }
    });

    return Array.from(map.values());
  }



  toggleCustomerInteractions(customerId: number) {
    this.openedCustomerId = this.openedCustomerId === customerId ? null : customerId;
  }

  getFirstInteraction(customerId: number) {
    return this.interactions.find(i => i.customer?.customerId === customerId);
  }

  filterByCustomer(customerId: number) {
    return this.interactions.filter(i => i.customer?.customerId === customerId);
  }
  getLastInteractionOfCustomer(interaction: CustomerInteraction): CustomerInteraction | null {
    if (!interaction.customer) return null;

    const customerId = 'customerId' in interaction.customer ? interaction.customer.customerId : null;
    const customerType = this.getCustomerType(interaction.customer);

    if (!customerId || !customerType) return null;

    const customerInteractions = this.interactions
      .filter(i => {
        if (!i.customer) return false;
        return (
          ('customerId' in i.customer && i.customer.customerId === customerId) &&
          this.getCustomerType(i.customer) === customerType
        );
      })
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

    return customerInteractions.length ? customerInteractions[0] : null;
  }

  // Type guard برای مشخص کردن نوع مشتری
  private getCustomerType(customer: CustomerIndividual | CustomerCompany): 'individual' | 'company' {
    if ('fullName' in customer) return 'individual';
    if ('companyName' in customer) return 'company';
    throw new Error('Unknown customer type');
  }


  canEditInteraction(interaction: CustomerInteraction): boolean {
    // 1️⃣ مجوز ویرایش
    const hasUpdatePermission = this.hasPermission('customerinteraction.update');
    if (!hasUpdatePermission) return false;

    // 2️⃣ کاربر جاری
    const currentUserId = String(this.authService.getCurrentUserId() ?? '').trim();

    // 3️⃣ مالک تعامل (fallback به performedById)
    const ownerId = String(
      interaction.currentOwnerId || interaction.performedById || ''
    ).trim();

    const isOwner = ownerId !== '' && ownerId === currentUserId;
    const hasGetAllPermission = this.hasPermission('customerinteraction.getall');

    // 4️⃣ اگر نه مالک است نه getAll دارد → رد
    if (!(isOwner || hasGetAllPermission)) return false;

    // 5️⃣ 🔥 شرط جدید: فقط آخرین تعامل همان مشتری
    const lastInteraction = this.getLastInteractionOfCustomer(interaction);
    const isLastInteraction = lastInteraction?.id === interaction.id;

    console.log('🔹 currentUserId:', currentUserId);
    console.log('🔹 resolved ownerId:', ownerId);
    console.log('🔹 isOwner:', isOwner);
    console.log('🔹 hasGetAllPermission:', hasGetAllPermission);
    console.log('🔹 isLastInteraction:', isLastInteraction);

    return isLastInteraction;
  }



  toPersianDigits(value: any): string {
    if (value === null || value === undefined) return '-';
    return value.toString().replace(/[0-9]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  }
  canRefer1(interaction: CustomerInteraction): boolean {
    const currentUserId = String(this.authService.getCurrentUserId() ?? '').trim();

    // فقط صاحب فعلی تعامل می‌تواند ارجاع بزند
    const isOwner = String(interaction.currentOwnerId ?? '').trim() === currentUserId;
    if (!isOwner) return false;

    // فقط آخرین تعامل همان مشتری
    const lastInteraction = this.getLastInteractionOfCustomer(interaction);
    const isLastInteraction = lastInteraction?.id === interaction.id;

    console.log('🔹 currentUserId:', currentUserId);
    console.log('🔹 resolved ownerId:', interaction.currentOwnerId);
    console.log('🔹 isOwner:', isOwner);
    console.log('🔹 isLastInteraction:', isLastInteraction);

    return isLastInteraction;
  }

  hasAnyOperation: boolean = false;

  updateHasAnyOperation(): void {
    this.hasAnyOperation = this.filteredInteractions.some(
      i => this.canRefer1(i) || this.canEditInteraction(i) || this.hasPermission('customerinteraction.delete')
    );
  }




}
