import { CustomerCompany } from './customer-company.model';
import { CustomerIndividual } from './customer-individual.model';
import { User } from './user.model';

export type InvoiceType = 'Invoice' | 'Proforma';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Cancelled';

export interface InvoiceItem {
  productId: string | null;
  categoryId?: string | null; 
  quantity: number;
  unitPrice: number;
  discount?: number;
  priceAfterDiscount?: number;
  vatAmount?: number;
  finalPrice?: number;
}


export interface InvoiceAttachment {
  id?: number;
  fileName: string;
  fileUrl: string;
  description?: string;
  file?: File;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status?: InvoiceStatus;
  customerIndividualId?: number;
  customerIndividual?: CustomerIndividual;
  customerCompanyId?: number;
  customerCompany?: CustomerCompany;
  createdByUserId: string;
  createdByUser?: User;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  validityDays?: number;
  totalAmount?: number;
  invoiceItems: InvoiceItem[];
  attachments?: InvoiceAttachment[];
  createdAt?: string;
  updatedAt?: string;
}
