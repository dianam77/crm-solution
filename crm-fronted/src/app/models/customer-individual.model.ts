import { Email } from './email.model';
import { Phone } from './phone.model';
import { Address } from './address.model';

export interface CustomerIndividual {
  customerId: number;
  firstName: string;
  lastName: string;
  fatherName?: string;
  birthDate?: string;
  nationalCode?: string;
  identityNumber?: string;
  gender?: string;
  maritalStatus?: string;
  emails: Email[];
  contactPhones: Phone[];
  addresses: Address[];


  fullName?: string;
}
export interface CreateCustomerIndividual {
  firstName: string;
  lastName: string;
  fatherName?: string;
  birthDate?: string;
  nationalCode?: string;
  identityNumber?: string;
  gender?: string;
  maritalStatus?: string;
  emails: Email[];
  contactPhones: Phone[];
  addresses: Address[];
}
