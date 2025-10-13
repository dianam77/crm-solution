import { CustomerIndividual } from "./customer-individual.model";

export interface Email {
  emailId?: number;
  individualCustomerId?: number;
  individualCustomer?: any;
  companyCustomerId?: number;
  companyCustomer?: any;
  mainCompanyId?: number;

  emailAddress: string;
  emailType?: string;
  isPrimary?: boolean;
}
