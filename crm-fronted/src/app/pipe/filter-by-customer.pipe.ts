import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByCustomer',
  pure: true // باعث می‌شود فقط وقتی داده تغییر کند اجرا شود
})
export class FilterByCustomerPipe implements PipeTransform {

  transform(interactions: any[], customerId: number): any[] {
    if (!interactions || customerId == null) return [];
    return interactions.filter(i => i.customer?.customerId === customerId);
  }

}
