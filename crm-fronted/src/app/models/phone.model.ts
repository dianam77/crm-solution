import { CustomerIndividual } from "./customer-individual.model";

export interface Phone {
  phoneId?: number;
  individualCustomerId?: number;
  individualCustomer?: any;
  companyCustomerId?: number;
  companyCustomer?: any;
  mainCompanyId?: number;

  phoneNumber: string;
  phoneType?: string;
  extension?: string;
}
