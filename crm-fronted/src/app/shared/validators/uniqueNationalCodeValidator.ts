import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CustomerIndividualService } from '../../services/customer-individual.service';

export function uniqueNationalCodeValidator(customerService: CustomerIndividualService, editingCustomerId?: number): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) {
      return of(null);
    }

    return customerService.checkNationalCodeExists(control.value).pipe(
      map(exists => {
        if (exists) {
          if (
            editingCustomerId &&
            control.parent &&
            control.parent.get('customerId')?.value === editingCustomerId
          ) {
            return null;
          }
          return { nationalCodeNotUnique: true };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  };
}
