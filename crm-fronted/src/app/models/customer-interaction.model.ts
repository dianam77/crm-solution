import { CustomerCompany } from "./customer-company.model";
import { CustomerIndividual } from "./customer-individual.model";


export interface CustomerInteractionAttachment {
  id?: number;
  filePath: string;       
  originalName?: string;  
  createdAt?: string;
}




export interface CustomerInteraction {
  id?: number;
  interactionType?: number | string;
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  subject?: string;
  notes?: string;

  individualCustomerId?: number;
  companyCustomerId?: number;

  productIds?: string[];   
  categoryIds?: string[];  

  attachments?: CustomerInteractionAttachment[];


  customer?: CustomerIndividual | CustomerCompany;
  productName?: string[];
  categoryName?: string[];
  performedBy?: string;  
}


export interface CustomerInteractionUpdateDto {
  individualCustomerId?: number;
  companyCustomerId?: number;
  interactionType: number;
  startDateTime: string;
  endDateTime?: string;
  durationMinutes?: number;
  subject?: string;
  notes?: string;
  categoryIds?: string[];
  productIds?: string[];
  existingAttachmentPaths?: string;  
}
