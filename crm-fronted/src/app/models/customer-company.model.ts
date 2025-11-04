import { Address } from './address.model';
import { Email } from './email.model';
import { Phone } from './phone.model';
import { CustomerIndividual } from './customer-individual.model';

export interface CustomerCompanyRelation {
  relationId?: number;
  individualCustomerId?: number; 
  individualCustomer?: CustomerIndividual;
  relationType?: string;
  startDate?: string;
  description?: string;
}

export interface CustomerCompany {
  customerId?: number;
  companyName: string;
  economicCode?: string;
  nationalId?: string;
  registerNumber?: string;
  establishmentDate?: string;
  industryField?: string;
  website?: string;
  emails: Email[];
  contactPhones: Phone[];
  addresses: Address[];
  customerCompanyRelations: CustomerCompanyRelation[];
}
