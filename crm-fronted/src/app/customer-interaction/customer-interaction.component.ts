import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import moment from 'moment-jalaali';
import { forkJoin } from 'rxjs';
import { NgPersianDatepickerModule } from 'ng-persian-datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { jwtDecode } from 'jwt-decode';
import { NgSelectModule } from '@ng-select/ng-select';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { CustomerInteractionService } from '../services/customer-interaction.service';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { CustomerCompanyService } from '../services/customer-company.service';
import { AuthService } from '../services/auth.service';
import { AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CustomerInteraction } from '../models/customer-interaction.model';
import { CustomerIndividual } from '../models/customer-individual.model';
import { CustomerCompany } from '../models/customer-company.model';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';
import { CustomerInteractionAttachment } from '../models/CustomerInteractionAttachment';

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
 

  

  constructor(
    private fb: FormBuilder,
    private interactionService: CustomerInteractionService,
    private individualService: CustomerIndividualService,
    private companyService: CustomerCompanyService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
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

  filteredProductsByGroup: Product[][] = []; 

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
    this.filteredProductsByGroup[index] = this.allProducts.filter(p => selectedIds.includes(p.categoryId));
    this.categoryProductGroups.at(index).patchValue({ productIds: [] });
  }

  get categoryProductFormArray(): FormArray {
    return this.form.get('categoryProductFormArray') as FormArray;
  }

  ngOnInit(): void {
    this.currentUserName = this.authService.getCurrentUserName() || '';
    this.authService.currentUser$.subscribe(name => this.currentUserName = name || '');
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
        this.filteredProducts = [];
        this.loadInteractions();

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
    this.interactionService.getAll().subscribe({
      next: res => {
        this.interactions = res.map(i => {
        
          if (typeof i.interactionType === 'string') {
            const found = this.interactionTypes.find(x => x.key === i.interactionType);
            i.interactionType = found ? found.value : undefined;
          } else if (typeof i.interactionType === 'number') {
            i.interactionType = Number(i.interactionType);
          } else {
            i.interactionType = undefined;
          }

          i.customer = i.individualCustomerId
            ? this.individualCustomers.find(c => c.customerId === i.individualCustomerId)
            : i.companyCustomerId
              ? this.companyCustomers.find(c => c.customerId === i.companyCustomerId)
              : undefined;

          i.productName = i.productIds?.map(pid => this.allProducts.find(p => p.id === pid)?.name || '').filter(n => n);
          i.categoryName = i.categoryIds?.map(cid => this.categories.find(c => c.id === cid)?.name || '').filter(n => n);

   
          i.performedBy = this.currentUserName || '-';

          return i;
        });
      },
      error: err => console.error('Error loading interactions:', err)
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

    return moment(startISO, 'YYYY-MM-DDTHH:mm:ss', true).add(duration, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
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


    const interactionType = this.form.get('interactionType')?.value;
    if (interactionType != null) formData.append('InteractionType', interactionType.toString());


    const startDateISO = this.getStartDateTimeISO();
    if (!startDateISO) {
      alert('لطفاً تاریخ و ساعت شروع را به درستی وارد کنید.');
      return;
    }
    formData.append('StartDateTime', startDateISO);

    const duration = this.form.get('durationMinutes')?.value;
    if (duration && !isNaN(duration)) {
      formData.append('DurationMinutes', duration.toString());
      const endDateISO = this.calculateEndDate();
      if (endDateISO) formData.append('EndDateTime', endDateISO);
    }

 
    const subject = this.form.get('subject')?.value;
    const notes = this.form.get('notes')?.value;
    if (subject) formData.append('Subject', subject);
    if (notes) formData.append('Notes', notes);


    const categoryProductGroups = this.form.get('categoryProductGroups') as FormArray;
    if (categoryProductGroups && categoryProductGroups.length > 0) {
      const combinedData: { CategoryIds: string[]; ProductIds: string[] }[] = [];
      categoryProductGroups.controls.forEach(group => {
        const cats = (group.get('categoryIds')?.value || []).map((c: any) => c.toString());
        const prods = (group.get('productIds')?.value || []).map((p: any) => p.toString());
        if (cats.length > 0 || prods.length > 0) combinedData.push({ CategoryIds: cats, ProductIds: prods });
      });
      formData.append('CategoryProductGroupsJson', JSON.stringify(combinedData));
    }


    if (this.selectedCustomerType === 'individual' && this.form.get('individualCustomerId')?.value) {
      formData.append('IndividualCustomerId', this.form.get('individualCustomerId')?.value.toString());
    } else if (this.selectedCustomerType === 'company' && this.form.get('companyCustomerId')?.value) {
      formData.append('CompanyCustomerId', this.form.get('companyCustomerId')?.value.toString());
    }

    this.currentAttachmentFiles.forEach(f => {
      formData.append('attachments', f.file, f.originalName);
    });


    if (this.existingAttachments?.length) {
      const existingPaths = this.existingAttachments.map(f => f.filePath).join(',');
      formData.append('ExistingAttachmentPaths', existingPaths);
    }


    const plainObject: any = {};
    formData.forEach((v, k) => {
      try {
        plainObject[k] = JSON.parse(v as string);
      } catch {
        plainObject[k] = v;
      }
    });
    console.log('📦 Payload Sent to Backend:', plainObject);


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

    
    this.form.patchValue({
      interactionType: Number(i.interactionType),
      startDateTime: i.startDateTime ? moment(i.startDateTime).format('jYYYY/jMM/jDD') : '',
      startTime: i.startDateTime ? moment(i.startDateTime).format('HH:mm') : '',
      durationMinutes: [0, 1].includes(Number(i.interactionType)) ? i.durationMinutes ?? null : null,
      subject: i.subject ?? '',
      notes: i.notes ?? '',
      individualCustomerId: i.individualCustomerId ?? null,
      companyCustomerId: i.companyCustomerId ?? null
    });

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


    this.formattedTime = i.startDateTime ? moment(i.startDateTime).format('HH:mm') : '';


    this.existingAttachments = i.attachments?.map(a => ({
      filePath: a.filePath ?? '',
      originalName: a.filePath?.split('/').pop() ?? ''
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
    if (typeof type === 'string') {
      const t = this.interactionTypes.find(x => x.key === type);
      return t?.label || '-';
    }
    const t = this.interactionTypes.find(x => x.value === Number(type));
    return t?.label || '-';
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

  i.categoryName.forEach(category => {

    const productsForCategory = (i.productName || []).filter(pName => {

      const product = this.allProducts.find(p => p.name === pName);
      return product?.categoryId === this.categories.find(c => c.name === category)?.id;
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
}
