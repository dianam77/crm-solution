import { CustomerCompany } from "./customer-company.model";
import { CustomerIndividual } from "./customer-individual.model";

export enum InteractionType {
  Call = 0,
  Meeting = 1,
  Email = 2,
  SMS = 3,
  Note = 4,
  Other = 99
}

export interface CustomerInteractionAttachment {
  id?: number;
  filePath: string;
  originalName?: string;
  createdAt?: string;
}

export interface CategoryProductGroup {
  categoryIds: string[];
  productIds: string[];
}

export interface CustomerInteraction {
  id?: number;
  interactionType?: InteractionType | number;
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  subject?: string;
  notes?: string;

  createdById?: string;
  performedById?: string;
  currentOwnerId?: string;

  createdByName?: string;
  performedByName?: string;
  currentOwnerName?: string;

  customerName?: string;

  individualCustomerId?: number;
  companyCustomerId?: number;

  productIds?: string[];
  categoryIds?: string[];

  attachments?: CustomerInteractionAttachment[];

  customer?: CustomerIndividual | CustomerCompany;
  productName?: string | string[];
  categoryName?: string | string[];

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // ⬅️ اضافه شده برای سازگاری با backend
  isOwnedByCurrentUser?: boolean;
}


// ===================== Create DTO =====================
export interface CustomerInteractionCreateDto {
  individualCustomerId?: number;
  companyCustomerId?: number;
  interactionType: InteractionType | number;
  startDateTime: string;
  endDateTime?: string;
  durationMinutes?: number;
  subject?: string;
  notes?: string;

  // گروه‌ها از فرم ارسال می‌شوند
  categoryIds?: string[];
  productIds?: string[];

  attachments?: File[];

  isActive?: boolean;
}

// ===================== Update DTO =====================
export interface CustomerInteractionUpdateDto {
  individualCustomerId?: number;
  companyCustomerId?: number;
  interactionType: InteractionType | number;
  startDateTime: string;
  endDateTime?: string;
  durationMinutes?: number;
  subject?: string;
  notes?: string;

  categoryIds?: string[];
  productIds?: string[];

  // فایل‌های آپلود جدید
  attachments?: File[];

  // نگه داشتن فایل‌های قدیمی
  existingAttachmentPaths?: string[];

  isActive?: boolean;
}
