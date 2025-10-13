import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';

import { CustomerCompany, CustomerCompanyRelation } from '../models/customer-company.model';
import { CustomerIndividual } from '../models/customer-individual.model';
import { Province } from '../models/Province.model';
import { City } from '../models/City.model';
import { Email } from '../models/email.model';
import { Phone } from '../models/phone.model';
import { Address } from '../models/address.model';

import { LocationService } from '../services/location.service';
import { CustomerCompanyService } from '../services/customer-company.service';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { emailValidator } from '../shared/validators/validate-email.directive';
import { UserService } from '../services/user.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-customer-company-list',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './customer-company-list.component.html',
  styleUrls: ['./customer-company-list.component.css']
})
export class CustomerCompanyListComponent implements OnInit {
  provinces: Province[] = [];
  citiesMap: { [provinceId: number]: City[] } = {};
  companies: CustomerCompany[] = [];
  individualCustomers: CustomerIndividual[] = [];

  canEdit = false;
  userRole: string | null = null;

  showCompanyForm = false;
  isCompanyEditMode = false;
  editingCompanyId: number | null = null;

  emailTypes = [
    { value: 'personal', label: 'شخصی' },
    { value: 'work', label: 'کاری' },
    { value: 'other', label: 'سایر' }
  ];

  phoneTypes = [
    { value: 'mobile', label: 'موبایل' },
    { value: 'landline', label: 'ثابت' },
    { value: 'work', label: 'اداری' },
    { value: 'home', label: 'خانگی' },
    { value: 'fax', label: 'فکس' },
    { value: 'emergency', label: 'اضطراری' },
    { value: 'voip', label: 'دیجیتال / VoIP' }
  ];

  addressTypes = [
    { value: 'home', label: 'منزل' },
    { value: 'work', label: 'محل کار' },
    { value: 'billing', label: 'صورتحساب' },
    { value: 'shipping', label: 'تحویل کالا' },
    { value: 'postal', label: 'آدرس پستی' },
    { value: 'warehouse', label: 'انبار' },
    { value: 'other', label: 'دیگر' }
  ];

  relationTypes = [
    { value: 'ceo', label: 'مدیرعامل' },
    { value: 'manager', label: 'مدیر' },
    { value: 'employee', label: 'کارمند' },
    { value: 'other', label: 'سایر' }
  ];

  companyForm: FormGroup;

  constructor(
    private locationService: LocationService,
    private customerService: CustomerCompanyService,
    private userService: UserService,
    private individualCustomerService: CustomerIndividualService,
    private fb: FormBuilder
  ) {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      economicCode: [''], // ولیدیتور برداشته شد
      registerNumber: [''], // ولیدیتور برداشته شد
      emails: this.fb.array([this.createEmailGroup()]),
      contactPhones: this.fb.array([this.createPhoneGroup()]),
      addresses: this.fb.array([this.createAddressGroup()]),
      customerCompanyRelations: this.fb.array([this.createRelationGroup()])
    });
  }

  ngOnInit(): void {
    this.setUserRole();
    this.loadProvinces();
    this.loadCompanies();
    this.loadIndividualCustomers();
  }

  private setUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        this.userRole = Array.isArray(roles) ? roles[0] : roles;
        this.canEdit = this.userRole === 'Admin' || this.userRole === 'Manager';
      } catch {
        this.canEdit = false;
      }
    }
  }

  // ======= Load Data =======
  loadProvinces() { this.locationService.getProvinces().subscribe(d => this.provinces = d); }
  loadCompanies() {
    this.customerService.getAll().subscribe(companies => {
      this.companies = companies;

      // جمع‌آوری تمام provinceId هایی که در آدرس‌ها هستند
      const provinceIds = Array.from(new Set(
        companies.flatMap(c => c.addresses?.map(a => a.provinceId).filter(pid => pid != null) || [])
      ));

      // بارگذاری شهرهای هر استان
      provinceIds.forEach(provinceId => {
        if (provinceId != null && !this.citiesMap[provinceId]) {
          this.locationService.getCities(provinceId).subscribe(cities => {
            this.citiesMap[provinceId] = cities;
          });
        }
      });
    });
  }

  loadIndividualCustomers() { this.individualCustomerService.getAll().subscribe(d => this.individualCustomers = d); }

  // ======= Form Arrays =======
  get companyEmails() { return this.companyForm.get('emails') as FormArray; }
  get companyPhones() { return this.companyForm.get('contactPhones') as FormArray; }
  get companyAddresses() { return this.companyForm.get('addresses') as FormArray; }
  get companyRelations() { return this.companyForm.get('customerCompanyRelations') as FormArray; }

  createEmailGroup = (email?: Email): FormGroup => this.fb.group({
    emailId: [email?.emailId || 0],
    emailAddress: [email?.emailAddress || '', [Validators.required, emailValidator()]],
    emailType: [email?.emailType || 'personal', Validators.required],
    isPrimary: [email?.isPrimary || false]
  });

  createPhoneGroup = (phone?: Phone): FormGroup => this.fb.group({
    phoneId: [phone?.phoneId || 0],
    phoneType: [phone?.phoneType || 'mobile', Validators.required],
    phoneNumber: [phone?.phoneNumber || '', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
    extension: [phone?.extension || '']
  });

  createAddressGroup = (address?: Address): FormGroup => this.fb.group({
    addressId: [address?.addressId || 0],
    fullAddress: [address?.fullAddress || '', Validators.required],
    provinceId: [address?.provinceId || null, Validators.required],
    cityId: [{ value: address?.cityId || null, disabled: !address?.provinceId }, Validators.required],
    postalCode: [address?.postalCode || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    addressType: [address?.addressType || 'work', Validators.required]
  });

  createRelationGroup = (relation?: CustomerCompanyRelation): FormGroup => this.fb.group({
    relationId: [relation?.relationId || 0],
    individualCustomerId: [relation?.individualCustomerId || null, Validators.required],
    relationType: [relation?.relationType || '', Validators.required]
  });

  // ======= Province / City =======
  onCompanyProvinceChange(index: number) {
    const addressGroup = this.companyAddresses.at(index) as FormGroup;
    const provinceId = addressGroup.get('provinceId')?.value;
    const cityControl = addressGroup.get('cityId');

    if (provinceId) {
      this.locationService.getCities(provinceId).subscribe(cities => {
        this.citiesMap[provinceId] = cities;
        cityControl?.enable();
        cityControl?.setValue(null);
      });
    } else {
      cityControl?.setValue(null);
      cityControl?.disable();
    }
  }

  // ======= Add / Remove =======
  addCompanyEmail() { this.companyEmails.push(this.createEmailGroup()); }
  removeCompanyEmail(i: number) { if (this.companyEmails.length > 1) this.companyEmails.removeAt(i); }

  addCompanyPhone() { this.companyPhones.push(this.createPhoneGroup()); }
  removeCompanyPhone(i: number) { if (this.companyPhones.length > 1) this.companyPhones.removeAt(i); }

  addCompanyAddress() { this.companyAddresses.push(this.createAddressGroup()); }
  removeCompanyAddress(i: number) { if (this.companyAddresses.length > 1) this.companyAddresses.removeAt(i); }

  addCompanyRelation() { this.companyRelations.push(this.createRelationGroup()); }
  removeCompanyRelation(i: number) { if (this.companyRelations.length > 1) this.companyRelations.removeAt(i); }

  // ======= Reset / Toggle Form =======
  resetForm() {
    this.companyForm.reset();
    this.companyEmails.clear();
    this.companyPhones.clear();
    this.companyAddresses.clear();
    this.companyRelations.clear();
    this.companyEmails.push(this.createEmailGroup());
    this.companyPhones.push(this.createPhoneGroup());
    this.companyAddresses.push(this.createAddressGroup());
    this.companyRelations.push(this.createRelationGroup());
  }

  toggleCompanyForm() {
    this.showCompanyForm = !this.showCompanyForm;
    if (!this.showCompanyForm) this.resetForm();
  }

  // ======= Edit =======
  editCompany(company: CustomerCompany) {
    this.isCompanyEditMode = true;
    this.editingCompanyId = company.customerId ?? null;

    this.companyEmails.clear();
    this.companyPhones.clear();
    this.companyAddresses.clear();
    this.companyRelations.clear();

    this.companyForm.patchValue({
      companyName: company.companyName,
      economicCode: company.economicCode,
      registerNumber: company.registerNumber
    });

    (company.emails || []).forEach(e => this.companyEmails.push(this.createEmailGroup(e)));
    if (this.companyEmails.length === 0) this.companyEmails.push(this.createEmailGroup());

    (company.contactPhones || []).forEach(p => this.companyPhones.push(this.createPhoneGroup(p)));
    if (this.companyPhones.length === 0) this.companyPhones.push(this.createPhoneGroup());

    (company.addresses || []).forEach(a => {
      const addrGroup = this.createAddressGroup(a);
      this.companyAddresses.push(addrGroup);
      addrGroup.get('cityId')?.enable({ emitEvent: false });
      if (a.provinceId != null) {
        const provinceId = a.provinceId;
        this.locationService.getCities(provinceId).subscribe(cities => {
          this.citiesMap[provinceId] = cities;
          addrGroup.get('cityId')?.setValue(a.cityId ?? null);
        });
      }
    });
    if (this.companyAddresses.length === 0) this.companyAddresses.push(this.createAddressGroup());

    (company.customerCompanyRelations || []).forEach(r => this.companyRelations.push(this.createRelationGroup(r)));
    if (this.companyRelations.length === 0) this.companyRelations.push(this.createRelationGroup());

    this.showCompanyForm = true;
  }

  // ======= Save =======
  saveCompany() {
    for (let addr of this.companyAddresses.controls) {
      const postalCode = addr.get('postalCode')?.value || '';
      if (postalCode.length > 10) {
        alert('کد پستی نمی‌تواند بیشتر از ۱۰ رقم باشد!');
        return;
      }
    }

    this.companyAddresses.controls.forEach(ctrl => ctrl.get('cityId')?.enable({ emitEvent: false }));

    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      alert('فرم ناقص است! لطفاً Console را برای جزئیات خطا بررسی کنید.');
      return;
    }

    const formValue = this.companyForm.getRawValue();
    const payload = {
      customerId: this.editingCompanyId ?? 0,
      companyName: formValue.companyName,
      economicCode: formValue.economicCode,
      registerNumber: formValue.registerNumber,
      emails: formValue.emails,
      contactPhones: formValue.contactPhones,
      addresses: formValue.addresses,
      customerCompanyRelations: formValue.customerCompanyRelations
    };

    const request$ = this.isCompanyEditMode
      ? this.customerService.update(this.editingCompanyId!, payload)
      : this.customerService.create(payload);

    request$.subscribe({
      next: () => {
        this.loadCompanies();
        this.resetForm();
        this.showCompanyForm = false;
        this.isCompanyEditMode = false;
        this.editingCompanyId = null;
      },
      error: err => {
        console.error('Error saving company:', err);
        alert('در هنگام ذخیره خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      }
    });
  }

  // ======= Delete =======
  deleteCompany(companyId: number) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    this.customerService.delete(companyId).subscribe(() => this.loadCompanies());
  }

  getProvinceName(provinceId: number | null): string {
    if (!provinceId) return '-';
    const province = this.provinces.find(p => p.provinceId === provinceId);
    return province ? province.name : '-';
  }

  getCityName(provinceId: number | null, cityId: number | null): string {
    if (!provinceId || !cityId) return '-';
    const cities = this.citiesMap[provinceId] || [];
    const city = cities.find(c => c.cityId === cityId);
    return city ? city.name : '-';
  }

}
