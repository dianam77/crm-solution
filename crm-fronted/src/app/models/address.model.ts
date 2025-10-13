import { CustomerIndividual } from "./customer-individual.model";

export interface Address {
  addressId?: number;
  fullAddress: string;
  provinceId: number | null;
  cityId: number | null;
  postalCode?: string;
  addressType?: string;
  provinceName?: string;
  cityName?: string;

  individualCustomerId?: number;
  individualCustomer?: any;
  companyCustomerId?: number;
  companyCustomer?: any;
  mainCompanyId?: number;
}
