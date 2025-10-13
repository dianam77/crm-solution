import { CustomerCompany } from "./customer-company.model";
import { CustomerIndividual } from "./customer-individual.model";

export interface CustomerInteractionAttachment {
  id?: number;
  filePath: string;
  createdAt?: string;
}

export interface CustomerInteraction {
  id?: number;
  individualCustomerId?: number | null;
  companyCustomerId?: number | null;
  interactionType: number | string | null; // ← اضافه شد
  startDateTime: string;
  endDateTime?: string | null;        // ← null اضافه شد
  durationMinutes?: number | null;    // ← null اضافه شد
  subject?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  attachments?: CustomerInteractionAttachment[];
  customer?: CustomerIndividual | CustomerCompany;
}
