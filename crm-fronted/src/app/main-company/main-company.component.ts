import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Province } from '../models/Province.model';
import { City } from '../models/City.model';
import { LocationService } from '../services/location.service';
import { MainCompanyService } from '../services/main-company.service';
import { MainCompany } from '../models/main-company.model';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-main-company',
  templateUrl: './main-company.component.html',
  styleUrls: ['./main-company.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class MainCompanyComponent implements OnInit {
  companyForm!: FormGroup;
  showForm = false;
  isEditMode = false;
  canEdit = true; 
  provinces: Province[] = [];
  citiesMap: { [provinceId: number]: City[] } = {};
  companies: MainCompany[] = [];
  permissions: string[] = []; 

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

  phoneTypes = [
    { value: 'mobile', label: 'موبایل' },
    { value: 'landline', label: 'ثابت' },
    { value: 'work', label: 'اداری' },
    { value: 'home', label: 'خانگی' },
    { value: 'fax', label: 'فکس' },
    { value: 'emergency', label: 'اضطراری' },
    { value: 'voip', label: 'دیجیتال / VoIP' }
  ];

  emailTypes = [
    { value: 'personal', label: 'شخصی' },
    { value: 'work', label: 'کاری' },
    { value: 'other', label: 'سایر' }
  ];

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private mainCompanyService: MainCompanyService
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadProvinces();
    this.loadCompaniesFromServer();
  }


  initForm() {
    this.companyForm = this.fb.group({
      mainCompanyId: [null],
      companyName: ['', Validators.required],
      economicCode: [''],
      registrationNumber: [''],
      emails: this.fb.array([this.createEmail()]),
      contactPhones: this.fb.array([this.createPhone()]),
      addresses: this.fb.array([this.createAddress()]),
      websites: this.fb.array([this.createWebsite()])
    });
  }

 
  createEmail(): FormGroup {
    return this.fb.group({
      emailId: [0],
      emailAddress: ['', [Validators.required, Validators.email]],
      emailType: ['personal', Validators.required],
      isPrimary: [false]
    });
  }

  createPhone(): FormGroup {
    return this.fb.group({
      phoneId: [0],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      phoneType: ['mobile', Validators.required],
      extension: ['']
    });
  }

  createAddress(): FormGroup {
    return this.fb.group({
      addressId: [0],
      fullAddress: ['', Validators.required],
      provinceId: ['', Validators.required],
      cityId: [{ value: '', disabled: true }, Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      addressType: ['work', Validators.required]
    });
  }

  createWebsite(): FormGroup {
    return this.fb.group({
      websiteId: [0],
      url: ['', Validators.required]
    });
  }


  get companyEmails() { return this.companyForm.get('emails') as FormArray; }
  get companyPhones() { return this.companyForm.get('contactPhones') as FormArray; }
  get companyAddresses() { return this.companyForm.get('addresses') as FormArray; }
  get companyWebsites() { return this.companyForm.get('websites') as FormArray; }

  addEmail() { this.companyEmails.push(this.createEmail()); }
  removeEmail(index: number) { if (this.companyEmails.length > 1) this.companyEmails.removeAt(index); }

  addPhone() { this.companyPhones.push(this.createPhone()); }
  removePhone(index: number) { if (this.companyPhones.length > 1) this.companyPhones.removeAt(index); }

  addAddress() { this.companyAddresses.push(this.createAddress()); }
  removeAddress(index: number) { if (this.companyAddresses.length > 1) this.companyAddresses.removeAt(index); }

  addWebsite() { this.companyWebsites.push(this.createWebsite()); }
  removeWebsite(index: number) { if (this.companyWebsites.length > 1) this.companyWebsites.removeAt(index); }

  onProvinceChange(index: number) {
    const address = this.companyAddresses.at(index);
    const provinceId = Number(address.get('provinceId')?.value);
    if (provinceId) {
      this.locationService.getCities(provinceId).subscribe((cities: City[]) => {
        this.citiesMap[provinceId] = cities;
        address.get('cityId')?.enable();
        address.get('cityId')?.setValue('');
      });
    } else {
      address.get('cityId')?.disable();
      address.get('cityId')?.setValue('');
    }
  }


  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm() {
    this.companyForm.reset();
    this.isEditMode = false;
    while (this.companyEmails.length > 1) this.companyEmails.removeAt(1);
    while (this.companyPhones.length > 1) this.companyPhones.removeAt(1);
    while (this.companyAddresses.length > 1) this.companyAddresses.removeAt(1);
    while (this.companyWebsites.length > 1) this.companyWebsites.removeAt(1);
  }


  saveCompany() {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return alert('لطفاً فرم را کامل کنید.');
    }

    const payload: any = { ...this.companyForm.value };


    payload.mainCompanyId = payload.mainCompanyId != null ? Number(payload.mainCompanyId) : undefined;
    payload.addresses = payload.addresses.map((a: any) => ({
      ...a,
      provinceId: Number(a.provinceId),
      cityId: Number(a.cityId),
      addressId: Number(a.addressId)
    }));
    payload.contactPhones = payload.contactPhones.map((p: any) => ({ ...p, phoneId: Number(p.phoneId) }));
    payload.emails = payload.emails.map((e: any) => ({ ...e, emailId: Number(e.emailId) }));
    payload.websites = payload.websites.map((w: any) => ({ ...w, websiteId: Number(w.websiteId) }));

    if (!this.isEditMode) delete payload.mainCompanyId;

    const request = this.isEditMode
      ? this.mainCompanyService.update(payload.mainCompanyId, payload)
      : this.mainCompanyService.create(payload);

    request.subscribe(() => {
      this.loadCompaniesFromServer();
      this.toggleForm();
    });
  }

  loadCompaniesFromServer() {
    this.mainCompanyService.getAll().subscribe((companies) => {
      this.companies = companies.map(c => ({
        ...c,
        addresses: (c.addresses || []).map(a => ({
          ...a,
          provinceId: Number(a.provinceId),
          cityId: Number(a.cityId)
        })),
        contactPhones: c.contactPhones || [],
        emails: c.emails || [],
        websites: c.websites || []
      }));

      this.companies.forEach(company => {
        company.addresses?.forEach((address: any) => {
          const provinceId = address.provinceId;
          if (provinceId && !this.citiesMap[provinceId]) {
            this.locationService.getCities(provinceId).subscribe(cities => {
              this.citiesMap[provinceId] = cities;
            });
          }
        });
      });
    });
  }


  loadProvinces() {
    this.locationService.getProvinces().subscribe((data: Province[]) => this.provinces = data);
  }

  
  editCompany(company: MainCompany) {
    this.showForm = true;
    this.isEditMode = true;


    this.companyEmails.clear();
    (company.emails || []).forEach(e => {
      const emailGroup = this.createEmail();
      emailGroup.patchValue(e);
      this.companyEmails.push(emailGroup);
    });
    if (!company.emails?.length) this.companyEmails.push(this.createEmail());

    this.companyPhones.clear();
    (company.contactPhones || []).forEach(p => {
      const phoneGroup = this.createPhone();
      phoneGroup.patchValue(p);
      this.companyPhones.push(phoneGroup);
    });
    if (!company.contactPhones?.length) this.companyPhones.push(this.createPhone());

    this.companyAddresses.clear();
    (company.addresses || []).forEach(a => {
      const provinceId = Number(a.provinceId);
      const cityId = Number(a.cityId);

      a.provinceId = provinceId;
      a.cityId = cityId;

      const addrGroup = this.createAddress();
      addrGroup.patchValue(a);
      if (!isNaN(provinceId) && provinceId > 0) {
        addrGroup.get('cityId')?.enable();
      }
      this.companyAddresses.push(addrGroup);

      if (!isNaN(provinceId) && !(provinceId in this.citiesMap)) {
        this.locationService.getCities(provinceId).subscribe(cities => {
          this.citiesMap[provinceId] = cities;
        });
      }
    });
    if (!company.addresses?.length) this.companyAddresses.push(this.createAddress());


    this.companyWebsites.clear();
    (company.websites || []).forEach(w => {
      const siteGroup = this.createWebsite();
      siteGroup.patchValue(w);
      this.companyWebsites.push(siteGroup);
    });
    if (!company.websites?.length) this.companyWebsites.push(this.createWebsite());


    this.companyForm.patchValue({
      mainCompanyId: company.mainCompanyId,
      companyName: company.companyName,
      economicCode: company.economicCode,
      registrationNumber: company.registrationNumber
    });
  }

  deleteCompany(id?: number) {
    if (!id) return;
    if (confirm('آیا مطمئن هستید می‌خواهید شرکت را حذف کنید؟')) {
      this.mainCompanyService.delete(id).subscribe(() => this.loadCompaniesFromServer());
    }
  }


  getProvinceName(provinceId?: number): string {
    if (!provinceId) return '-';
    const province = this.provinces.find(p => p.provinceId === provinceId);
    return province ? province.name : '-';
  }

  getCityName(provinceId?: number | null, cityId?: number | null): string {
    if (!provinceId || !cityId) return '-';
    const city = this.citiesMap[provinceId]?.find(c => c.cityId === cityId);
    return city ? city.name : '-';
  }

  getPhoneTypeLabel(phoneType?: string): string {
    const pt = this.phoneTypes.find(p => p.value === phoneType);
    return pt ? pt.label : '-';
  }

  getEmailTypeLabel(emailType?: string): string {
    const et = this.emailTypes.find(e => e.value === emailType);
    return et ? et.label : '-';
  }

  setPrimaryEmail(index: number) {
    this.companyEmails.controls.forEach((ctrl, i) => ctrl.get('isPrimary')?.setValue(i === index));
  }
}
