import { Component, OnInit } from '@angular/core';
import { LocationService } from '../services/location.service';
import { City } from '../models/City.model';
import { Province } from '../models/Province.model';
import { CustomerIndividualService } from '../services/customer-individual.service';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { emailValidator } from '../shared/validators/validate-email.directive';
import { UserService } from '../services/user.service';
import { jwtDecode } from 'jwt-decode';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-customer-individual-list',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './customer-individual-list.component.html',
  styleUrls: ['./customer-individual-list.component.css']
})
export class CustomerIndividualListComponent implements OnInit {
  provinces: Province[] = [];
  citiesMap: { [provinceId: number]: City[] } = {};
  customers: any[] = [];
  canEdit = false;
  userRole: string | null = null;

  showForm = false;
  isEditMode = false;
  editingCustomerId: number | null = null;

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

  customerForm: FormGroup;

  constructor(
    private locationService: LocationService,
    private customerService: CustomerIndividualService,
    private userService: UserService,

    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      customerId: [null],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      fatherName: [''],
      birthDate: [''],
      nationalCode: ['', [Validators.required, this.nationalCodeValidator()]],
      identityNumber: [''],
      gender: [''],
      maritalStatus: [''],
      emails: this.fb.array([this.createEmailGroup()]),
      contactPhones: this.fb.array([this.createPhoneGroup(true)]),
      addresses: this.fb.array([this.createAddressGroup()])
    });
  }
  private setUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        this.userRole = Array.isArray(roles) ? roles[0] : roles;

        this.canEdit = this.userRole === 'Admin' || this.userRole === 'Manager';
      } catch (err) {
        console.error('Invalid token', err);
        this.canEdit = false;
      }
    }
  }
  ngOnInit(): void {
    this.setUserRole();

    this.loadProvinces();
    this.loadCustomers();
    this.customerForm.get('nationalCode')?.valueChanges.subscribe(value => {
      if (!value) return;

      const isDuplicate = this.customers.some(customer =>
        customer.nationalCode === value &&
        (!this.isEditMode || customer.customerId !== this.editingCustomerId)
      );

      if (isDuplicate) {
        alert('کد ملی وارد شده تکراری است.');
      }
    });
  }

  nationalCodeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }
      if (!/^\d{10}$/.test(value)) {
        return { nationalCodeInvalid: 'کد ملی باید 10 رقم باشد' };
      }
      if (/^(\d)\1{9}$/.test(value)) {
        return { nationalCodeInvalid: 'کد ملی نامعتبر است' };
      }
      const check = +value[9];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += +value[i] * (10 - i);
      }
      const remainder = sum % 11;
      if ((remainder < 2 && check === remainder) || (remainder >= 2 && check === (11 - remainder))) {
        return null;
      }
      return { nationalCodeInvalid: 'کد ملی نامعتبر است' };
    };
  }

  loadProvinces() {
    this.locationService.getProvinces().subscribe((data: Province[]) => {
      this.provinces = data;
    });
  }

  loadCustomers() {
    this.customerService.getAll().subscribe(data => {
      this.customers = data;
    });
  }

  get emails() {
    return this.customerForm.get('emails') as FormArray;
  }

  get contactPhones() {
    return this.customerForm.get('contactPhones') as FormArray;
  }

  get addresses() {
    return this.customerForm.get('addresses') as FormArray;
  }

  createEmailGroup(): FormGroup {
    return this.fb.group({
      emailId: [null],
      emailAddress: ['', [Validators.required, emailValidator()]],
      emailType: ['', Validators.required],
      isPrimary: [false]
    });
  }

  createPhoneGroup(isFirst: boolean = false): FormGroup {
    return this.fb.group({
      phoneId: [null],
      phoneType: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      extension: ['']
    });
  }

  createAddressGroup(): FormGroup {
    return this.fb.group({
      addressId: [null],
      fullAddress: ['', Validators.required],
      provinceId: [null, Validators.required],
      cityId: [{ value: null, disabled: true }],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      addressType: ['', Validators.required]
    });
  }

  getAddressControl(index: number, controlName: string): AbstractControl | null {
    const addressGroup = this.addresses.at(index) as FormGroup | null;
    return addressGroup ? addressGroup.get(controlName) : null;
  }

  onProvinceChange(addressIndex: number) {
    const addressGroup = this.addresses.at(addressIndex);
    const provinceId = addressGroup.get('provinceId')?.value;

    if (provinceId) {
      this.locationService.getCities(provinceId).subscribe((data: City[]) => {
        this.citiesMap[provinceId] = data;
        const cityControl = addressGroup.get('cityId');
        cityControl?.enable();
        cityControl?.setValidators([Validators.required]);
        cityControl?.setValue(null);
        cityControl?.updateValueAndValidity();
      });
    } else {
      const cityControl = addressGroup.get('cityId');
      cityControl?.setValue(null);
      cityControl?.clearValidators();
      cityControl?.disable();
      cityControl?.updateValueAndValidity();
    }
  }

  addEmailField() {
    if (this.emails.controls.some(emailGroup => emailGroup.invalid)) {
      alert('لطفا همه ایمیل‌های موجود را کامل و معتبر کنید قبل از افزودن ایمیل جدید.');
      this.emails.controls.forEach(c => c.markAllAsTouched());
      return;
    }
    this.emails.push(this.createEmailGroup());
  }

  removeEmailField(index: number) {
    if (this.emails.length > 1) this.emails.removeAt(index);
  }

  addPhoneField() {
    if (this.contactPhones.controls.some(phoneGroup => phoneGroup.invalid)) {
      alert('لطفا همه شماره‌های تلفن موجود را کامل و معتبر کنید قبل از افزودن شماره جدید.');
      return;
    }
    this.contactPhones.push(this.createPhoneGroup());
  }

  removePhoneField(index: number) {
    if (this.contactPhones.length > 1) this.contactPhones.removeAt(index);
  }

  addAddressField() {
    if (this.addresses.controls.some(addressGroup => addressGroup.invalid)) {
      alert('لطفا همه آدرس‌های موجود را کامل و معتبر کنید قبل از افزودن آدرس جدید.');
      return;
    }
    this.addresses.push(this.createAddressGroup());
  }

  removeAddressField(index: number) {
    if (this.addresses.length > 1) this.addresses.removeAt(index);
  }
 private hasIncompleteContacts(): boolean {
    const incompleteEmails = this.emails.value.filter((email: any) =>
      (!email.emailAddress?.trim() || !email.emailType)
    );
    const incompletePhones = this.contactPhones.value.filter((phone: any) =>
      (!phone.phoneNumber?.trim() || !phone.phoneType)
    );
    const incompleteAddresses = this.addresses.value.filter((address: any) =>
      (!address.fullAddress?.trim() || !address.provinceId || !address.postalCode?.trim())
    );

    if (incompleteEmails.length || incompletePhones.length || incompleteAddresses.length) {
      alert('لطفاً همه ایمیل‌ها، تلفن‌ها و آدرس‌های ناقص را کامل کنید یا حذف کنید.');
      return true;
    }
    return false;
  }

  addCustomer() {
    if (!this.canEdit) {
      alert('شما اجازه ویرایش ندارید!');
      return;
    }

    if (this.customerForm.invalid) {
      alert('لطفاً فیلدهای ضروری را کامل کنید.');
      this.customerForm.markAllAsTouched();
      return;
    }

    if (this.hasIncompleteContacts()) {
      return;
    }
    for (let i = 0; i < this.emails.length; i++) {
      const emailGroup = this.emails.at(i);
      const emailAddress = emailGroup.get('emailAddress')?.value?.trim();
      const emailType = emailGroup.get('emailType')?.value;

      if ((emailAddress && !emailType) || (!emailAddress && emailType)) {
        alert(`ایمیل ردیف ${i + 1} ناقص است. لطفاً پر کنید یا حذف کنید.`);
        return;
      }
    }

    for (let i = 0; i < this.contactPhones.length; i++) {
      const phoneGroup = this.contactPhones.at(i);
      const phoneNumber = phoneGroup.get('phoneNumber')?.value?.trim();
      const phoneType = phoneGroup.get('phoneType')?.value;

      if ((phoneNumber && !phoneType) || (!phoneNumber && phoneType)) {
        alert(`شماره تلفن ردیف ${i + 1} ناقص است. لطفاً پر کنید یا حذف کنید.`);
        return;
      }
    }

    for (let i = 0; i < this.addresses.length; i++) {
      const addressGroup = this.addresses.at(i);
      const fullAddress = addressGroup.get('fullAddress')?.value?.trim();
      const provinceId = addressGroup.get('provinceId')?.value;
      const postalCode = addressGroup.get('postalCode')?.value?.trim();

      if ((fullAddress && (!provinceId || !postalCode)) ||
        ((!fullAddress) && (provinceId || postalCode))) {
        alert(`آدرس ردیف ${i + 1} ناقص است. لطفاً پر کنید یا حذف کنید.`);
        return;
      }
    }

    if (!this.validateContactArrays()) return;

    if (this.customerForm.invalid) {
      alert('لطفا همه فیلدهای ضروری را کامل و معتبر کنید.');
      this.customerForm.markAllAsTouched();
      return;
    }

    const newNationalCode = this.customerForm.get('nationalCode')?.value;

    const isDuplicateNationalCode = this.customers.some(customer =>
      customer.nationalCode === newNationalCode &&
      (!this.isEditMode || customer.customerId !== this.editingCustomerId)
    );

    if (isDuplicateNationalCode) {
      alert('کد ملی وارد شده تکراری است.');
      return;
    }

    const formValue = { ...this.customerForm.value };

    if (!formValue.customerId) {
      formValue.customerId = 0;
    }

    if (!formValue.vm) {
      formValue.vm = {};
    }

    formValue.emails = (formValue.emails || []).map((e: any) => ({
      ...e,
      emailId: e.emailId ?? 0
    }));

    formValue.contactPhones = (formValue.contactPhones || []).map((p: any) => ({
      ...p,
      phoneId: p.phoneId ?? 0
    }));

    formValue.addresses = (formValue.addresses || []).map((a: any) => ({
      ...a,
      addressId: a.addressId ?? 0,
      provinceId: a.provinceId ? Number(a.provinceId) : null,
      cityId: a.cityId ? Number(a.cityId) : null,
    }));

    if (!formValue.birthDate) {
      delete formValue.birthDate;
    }

    if (this.isEditMode && this.editingCustomerId !== null) {
      formValue.customerId = this.editingCustomerId;

      this.customerService.update(this.editingCustomerId, formValue).subscribe({
        next: () => {
          this.loadCustomers();
          this.toggleForm();
          this.resetForm();
          this.isEditMode = false;
          this.editingCustomerId = null;
        },
        error: (err) => {
          console.error('Error updating customer:', err);
          alert('خطا در بروزرسانی مشتری: ' + (err?.error?.message || err.statusText || err.message));
        }
      });
    } else {
      this.customerService.create(formValue).subscribe({
        next: () => {
          this.loadCustomers();
          this.toggleForm();
          this.resetForm();
        },
        error: (err) => {
          console.error('Error adding customer:', err);
          alert('خطای ثبت مشتری رخ داد: ' + (err?.error?.message || err.statusText || err.message));
        }
      });
    }
  }


  validateContactArrays(): boolean {
    for (let i = this.emails.length - 1; i >= 0; i--) {
      const emailGroup = this.emails.at(i);
      const emailAddress = emailGroup.get('emailAddress')?.value?.trim();
      const emailType = emailGroup.get('emailType')?.value;

      if (!emailAddress && !emailType) {
        const emailId = emailGroup.get('emailId')?.value ?? 0;
        if (emailId === 0) {
          this.emails.removeAt(i);
        }
      } else if (!emailAddress) {
        alert(`ایمیل در ردیف ${i + 1} خالی است. لطفا پر کنید یا حذف کنید.`);
        return false;
      } else if (!emailType) {
        alert(`نوع ایمیل در ردیف ${i + 1} مشخص نشده است.`);
        return false;
      } else if (emailGroup.invalid) {
        alert('لطفا ایمیل‌ها را کامل و معتبر وارد کنید.');
        return false;
      }
    }

    for (let i = this.contactPhones.length - 1; i >= 0; i--) {
      const phoneGroup = this.contactPhones.at(i);
      const phoneNumber = phoneGroup.get('phoneNumber')?.value?.trim();
      const phoneType = phoneGroup.get('phoneType')?.value;

      if (!phoneNumber && !phoneType) {
        const phoneId = phoneGroup.get('phoneId')?.value ?? 0;
        if (phoneId === 0) {
          this.contactPhones.removeAt(i);
        }
      } else if (!phoneNumber) {
        alert(`شماره تلفن در ردیف ${i + 1} خالی است. لطفا پر کنید یا حذف کنید.`);
        return false;
      } else if (!phoneType) {
        alert(`نوع شماره تلفن در ردیف ${i + 1} مشخص نشده است.`);
        return false;
      } else if (phoneGroup.invalid) {
        alert('لطفا شماره‌های تلفن را کامل و معتبر وارد کنید.');
        return false;
      }
    }

    for (let i = this.addresses.length - 1; i >= 0; i--) {
      const addressGroup = this.addresses.at(i);
      const fullAddress = addressGroup.get('fullAddress')?.value?.trim();
      const provinceId = addressGroup.get('provinceId')?.value;
      const postalCode = addressGroup.get('postalCode')?.value?.trim();

      if (!fullAddress && !provinceId && !postalCode) {
        const addressId = addressGroup.get('addressId')?.value ?? 0;
        if (addressId === 0) {
          this.addresses.removeAt(i);
        }
      } else if (!fullAddress) {
        alert(`آدرس در ردیف ${i + 1} خالی است. لطفا پر کنید یا حذف کنید.`);
        return false;
      } else if (!provinceId) {
        alert(`استان آدرس در ردیف ${i + 1} انتخاب نشده است.`);
        return false;
      } else if (!postalCode) {
        alert(`کد پستی در ردیف ${i + 1} خالی است. لطفا پر کنید یا حذف کنید.`);
        return false;
      } else if (addressGroup.invalid) {
        alert('لطفا آدرس‌ها را کامل و معتبر وارد کنید.');
        return false;
      }
    }

    return true;
  }


  resetForm() {
    this.customerForm.reset();
    this.emails.clear();
    this.emails.push(this.createEmailGroup());
    this.contactPhones.clear();
    this.contactPhones.push(this.createPhoneGroup(true));
    this.addresses.clear();
    this.addresses.push(this.createAddressGroup());
    this.citiesMap = {};
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.resetForm(); 
    } else {
      this.isEditMode = false;
      this.editingCustomerId = null;
    }
  }


  getProvinceName(provinceId: number | null): string {
    const province = this.provinces.find(p => p.provinceId === provinceId);
    return province ? province.name : '';
  }

  getCityName(provinceId: number | null, cityId: number | null): string {
    if (!provinceId || !cityId || !this.citiesMap[provinceId]) return '';
    const city = this.citiesMap[provinceId].find(c => c.cityId === cityId);
    return city ? city.name : '';
  }

  deleteCustomer(index: number) {
    if (!this.canEdit) {
      alert('شما اجازه حذف ندارید!');
      return;
    }
    const customer = this.customers[index];
    this.customerService.delete(customer.customerId).subscribe(() => {
      this.customers.splice(index, 1);
    });
  }

  getEmailTypeLabel(value: string): string {
    const email = this.emailTypes.find(e => e.value === value);
    return email ? email.label : value;
  }

  getPhoneTypeLabel(value: string): string {
    const phone = this.phoneTypes.find(p => p.value === value);
    return phone ? phone.label : value;
  }


  editCustomer(customer: any) {
    if (!this.canEdit) {
      alert('شما اجازه ویرایش ندارید!');
      return;
    }
    const hasIncompleteEmail = (customer.emails || []).some((email: any) =>
      (!email.emailAddress?.trim() || !email.emailType)
    );
    const hasIncompletePhone = (customer.contactPhones || []).some((phone: any) =>
      (!phone.phoneNumber?.trim() || !phone.phoneType)
    );
    const hasIncompleteAddress = (customer.addresses || []).some((address: any) =>
      (!address.fullAddress?.trim() || !address.provinceId || !address.postalCode?.trim())
    );
    if (hasIncompleteEmail || hasIncompletePhone || hasIncompleteAddress) {
      alert('این مشتری اطلاعات ناقص دارد. لطفاً آن‌ها را تکمیل کنید.');
    }

    this.showForm = true;
    this.isEditMode = true;
    this.editingCustomerId = customer.customerId;

    const cleanEmails = (customer.emails || []).map((email: any) => ({
      ...email,
      emailId: email.emailId ?? 0
    }));
    const cleanPhones = (customer.contactPhones || []).map((phone: any) => ({
      ...phone,
      phoneId: phone.phoneId ?? 0
    }));
    const cleanAddresses = (customer.addresses || []).map((address: any) => ({
      ...address,
      addressId: address.addressId ?? 0
    }));

    this.customerForm.patchValue({
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fatherName: customer.fatherName,
      birthDate: customer.birthDate ? customer.birthDate.split('T')[0] : '',
      nationalCode: customer.nationalCode,
      identityNumber: customer.identityNumber,
      gender: customer.gender,
      maritalStatus: customer.maritalStatus
    });

    this.emails.clear();
    if (cleanEmails.length) {
      cleanEmails.forEach((email: any) => {
        this.emails.push(this.fb.group({
          emailId: [email.emailId],
          emailAddress: [email.emailAddress, [Validators.required, emailValidator()]],
          emailType: [email.emailType, Validators.required],
          isPrimary: [email.isPrimary]
        }));
      });
    } else {
      this.emails.push(this.createEmailGroup());
    }

    this.contactPhones.clear();
    if (cleanPhones.length) {
      cleanPhones.forEach((phone: any) => {
        this.contactPhones.push(this.fb.group({
          phoneId: [phone.phoneId],
          phoneType: [phone.phoneType, Validators.required],
          phoneNumber: [phone.phoneNumber, [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
          extension: [phone.extension]
        }));
      });
    } else {
      this.contactPhones.push(this.createPhoneGroup(true));
    }

    this.addresses.clear();
    if (cleanAddresses.length) {
      cleanAddresses.forEach((address: any, index: number) => {
        this.addresses.push(this.fb.group({
          addressId: [address.addressId],
          fullAddress: [address.fullAddress, Validators.required],
          provinceId: [address.provinceId, Validators.required],
          cityId: [{ value: address.cityId, disabled: true }],
          postalCode: [address.postalCode, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
          addressType: [address.addressType, Validators.required]
        }));

        this.locationService.getCities(address.provinceId).subscribe((data: City[]) => {
          this.citiesMap[address.provinceId] = data;
          const cityControl = this.addresses.at(index).get('cityId');
          cityControl?.enable();
          cityControl?.setValue(address.cityId);
          cityControl?.updateValueAndValidity();
        });
      });
    } else {
      this.addresses.push(this.createAddressGroup());
    }
  }



}
