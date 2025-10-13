import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import moment from 'moment-jalaali';
import { forkJoin } from 'rxjs';
import { NgPersianDatepickerModule } from 'ng-persian-datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

import { CustomerInteractionService } from '../services/customer-interaction.service';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { CustomerCompanyService } from '../services/customer-company.service';
import { AuthService } from '../services/auth.service';
import { CustomerInteraction } from '../models/customer-interaction.model';
import { CustomerIndividual } from '../models/customer-individual.model';
import { CustomerCompany } from '../models/customer-company.model';

@Component({
  selector: 'app-customer-interaction',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgPersianDatepickerModule,
    NgxMaterialTimepickerModule,
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

  currentAttachmentFiles: File[] = [];
  existingAttachmentPaths: string[] = [];

  formattedTime = '';
  timeFormat: '12' | '24' = '24';
  amPm: 'AM' | 'PM' = 'AM';

  constructor(
    private fb: FormBuilder,
    private interactionService: CustomerInteractionService,
    private individualService: CustomerIndividualService,
    private companyService: CustomerCompanyService,
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
    });
  }

  ngOnInit(): void {
    this.currentUserName = this.authService.getCurrentUserName() || '';
    this.authService.currentUser$.subscribe(name => this.currentUserName = name || '');

    forkJoin({
      individual: this.individualService.getAll(),
      company: this.companyService.getAll()
    }).subscribe({
      next: ({ individual, company }) => {
        this.individualCustomers = individual;
        this.companyCustomers = company;
        this.loadInteractions();
      },
      error: err => console.error('Error loading customers:', err)
    });
  }

  loadInteractions(): void {
    this.interactionService.getAll().subscribe({
      next: res => {
        this.interactions = res.map(i => {
          // بررسی مقدار interactionType
          if (typeof i.interactionType === 'string') {
            // اگر به صورت متن آمده، معادل عددی آن را پیدا کن
            const found = this.interactionTypes.find(x => x.key === i.interactionType);
            i.interactionType = found ? found.value : null;
          } else if (typeof i.interactionType === 'number') {
            i.interactionType = Number(i.interactionType);
          } else {
            i.interactionType = null;
          }

          // ست کردن مشتری
          i.customer = i.individualCustomerId
            ? this.individualCustomers.find(c => c.customerId === i.individualCustomerId) ?? undefined
            : i.companyCustomerId
              ? this.companyCustomers.find(c => c.customerId === i.companyCustomerId) ?? undefined
              : undefined;

          return i;
        });
      },
      error: err => console.error('Error loading interactions:', err)
    });
  }

  selectCustomerType(type: 'individual' | 'company'): void {
    this.selectedCustomerType = type;
    if (type === 'individual') this.form.patchValue({ companyCustomerId: null });
    else this.form.patchValue({ individualCustomerId: null });
  }

  onFileChange(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = 10;
    const maxTotalSize = 50_000_000;

    const currentSize = this.currentAttachmentFiles.reduce((sum, f) => sum + f.size, 0);
    const newFilesSize = Array.from(files).reduce((sum, f) => sum + f.size, 0);

    if ((this.currentAttachmentFiles.length + files.length) > maxFiles) {
      alert(`حداکثر ${maxFiles} فایل می‌توانید انتخاب کنید!`);
      event.target.value = '';
      return;
    }

    if ((currentSize + newFilesSize) > maxTotalSize) {
      alert(`حجم کل فایل‌ها نمی‌تواند بیشتر از 50 MB باشد!`);
      event.target.value = '';
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'image/jpeg',
      'image/png'
    ];

    let duplicateFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`فرمت فایل "${file.name}" مجاز نیست!`);
        return;
      }

      const isDuplicate = this.currentAttachmentFiles.some(
        f => f.name === file.name && f.size === file.size
      );

      if (isDuplicate) {
        duplicateFiles.push(file.name);
        return;
      }

      this.currentAttachmentFiles.push(file);
    });

    if (duplicateFiles.length > 0) {
      alert(`فایل‌های زیر تکراری هستند و اضافه نشدند:\n${duplicateFiles.join('\n')}`);
    }

    event.target.value = '';
  }

  addFileInput(fileInput: HTMLInputElement): void { fileInput.click(); }
  removeNewAttachment(index: number): void { this.currentAttachmentFiles.splice(index, 1); }
  removeExistingAttachment(index: number): void { this.existingAttachmentPaths.splice(index, 1); }

  private normalizeTime(time: string): string {
    if (!time) return '';

    let cleanTime = time.trim();
    cleanTime = cleanTime.replace(/\s?(AM|PM)$/i, '');
    const parts = cleanTime.split(':');
    if (parts.length === 2) {
      const hour = parts[0].padStart(2, '0');
      const minute = parts[1].padStart(2, '0');
      cleanTime = `${hour}:${minute}`;
    }

    return cleanTime;
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

  calculateEndDate(): string | undefined {
    const startISO = this.getStartDateTimeISO();
    const duration = Number(this.form.get('durationMinutes')?.value);

    if (!startISO || isNaN(duration) || duration <= 0) return undefined;

    const m = moment(startISO, 'YYYY-MM-DDTHH:mm:ss', true);
    return m.add(duration, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
  }

  onTimeTextChange(value: string): void {
    const normalized = this.normalizeTime(value);
    if (!normalized) return;

    this.formattedTime = normalized;
    this.form.patchValue({ startTime: normalized });
  }

  editInteraction(i: CustomerInteraction): void {
    this.isEditMode = true;
    this.editingInteractionId = i.id ?? null;

    const type = Number(i.interactionType);

    this.form.patchValue({
      interactionType: type,
      startDateTime: moment(i.startDateTime).format('jYYYY/jMM/jDD'),
      startTime: moment(i.startDateTime).format('HH:mm'),
      durationMinutes: [0, 1].includes(type) ? i.durationMinutes ?? undefined : undefined,
      subject: i.subject ?? '',
      notes: i.notes ?? '',
      individualCustomerId: i.individualCustomerId ?? null,
      companyCustomerId: i.companyCustomerId ?? null,
    });

    this.formattedTime = moment(i.startDateTime).format('HH:mm');
    this.existingAttachmentPaths = [...(i.attachments?.map(a => a.filePath) || [])];

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

  isDurationEnabled(): boolean {
    const type = Number(this.form.get('interactionType')?.value);
    return [0, 1].includes(type);
  }

  submit(): void {
    if (this.form.invalid) return;

    const interactionType = this.form.get('interactionType')?.value;
    if (interactionType === null || interactionType === undefined) {
      alert('لطفاً نوع تعامل را انتخاب کنید.');
      return;
    }

    const formData = new FormData();
    formData.append('InteractionType', interactionType.toString());

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

    if (this.selectedCustomerType === 'individual' && this.form.get('individualCustomerId')?.value) {
      formData.append('IndividualCustomerId', this.form.get('individualCustomerId')?.value.toString());
    } else if (this.selectedCustomerType === 'company' && this.form.get('companyCustomerId')?.value) {
      formData.append('CompanyCustomerId', this.form.get('companyCustomerId')?.value.toString());
    }

    this.currentAttachmentFiles.forEach(file => formData.append('attachments', file, file.name));
    if (this.existingAttachmentPaths.length > 0) {
      formData.append('ExistingAttachmentPaths', this.existingAttachmentPaths.join(','));
    }

    const request = this.isEditMode && this.editingInteractionId
      ? this.interactionService.update(this.editingInteractionId, formData)
      : this.interactionService.create(formData);

    request.subscribe({
      next: () => {
        this.loadInteractions();
        this.resetForm();
      },
      error: err => {
        console.error('Error saving interaction:', err);
        alert('خطایی در ذخیره اطلاعات رخ داد. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  // **متد اصلاح شده برای نمایش نوع تعامل**
  getInteractionLabel(type: number | string | undefined): string {
    if (type === undefined || type === null || type === '') return '-';

    if (typeof type === 'string') {
      const t = this.interactionTypes.find(x => x.key === type);
      return t?.label || '-';
    }

    const t = this.interactionTypes.find(x => x.value === Number(type));
    return t?.label || '-';
  }

  deleteInteraction(id: number): void {
    if (!confirm('آیا از حذف این تعامل اطمینان دارید؟')) return;
    this.interactionService.delete(id).subscribe(() => {
      this.interactions = this.interactions.filter(i => i.id !== id);
    });
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
    this.existingAttachmentPaths = [];
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

  onFormatChange(value: '12' | '24'): void { this.timeFormat = value; }
  onAmPmChange(value: 'AM' | 'PM'): void { this.amPm = value; }
}
