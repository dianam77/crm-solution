import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const nationalCodeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null;

  const value = control.value.toString().replace(/\s+/g, '').trim();

  console.log('Validating national code:', value);

  if (value.length !== 10 || !/^\d{10}$/.test(value)) {
    return { nationalCodeInvalid: 'کد ملی باید ۱۰ رقم عددی باشد' };
  }

  if (/^(\d)\1{9}$/.test(value)) {
    return { nationalCodeInvalid: 'کد ملی معتبر نیست' };
  }

  const check = +value[9];
  const sum = Array.from({ length: 9 }, (_, i) => +value[i] * (10 - i))
    .reduce((acc, curr) => acc + curr, 0);

  const remainder = sum % 11;

  if ((remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder)) {
    return null;
  }

  return { nationalCodeInvalid: 'کد ملی معتبر نیست' };
};
