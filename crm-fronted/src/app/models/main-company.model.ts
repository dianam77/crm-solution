// main-company.model.ts
import { Email } from './email.model';
import { Phone } from './phone.model';
import { Address } from './address.model';
import { CompanyWebsite } from './company-website.model';

export interface MainCompany {
  mainCompanyId?: number;
  companyName: string;
  economicCode?: string;
  registrationNumber?: string;
  emails?: Email[];
  contactPhones?: Phone[];
  addresses?: Address[];
  websites?: CompanyWebsite[];
}
