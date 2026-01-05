// ===================== MODELS =====================
export interface CustomerInteractionReferral {
  id: number;
  customerId: number;
  customerName?: string;
  isIndividual: boolean;
  note?: string;
  referredAt?: string;
  isRead?: boolean;
  isActive?: boolean;

  assignedToId?: string;      // برای شناسایی کاربر دریافت‌کننده
  referredById?: string;      // برای شناسایی ارجاع‌دهنده
  assignedToName?: string;    // نام کاربر دریافت‌کننده
  referredByName?: string;    // نام ارجاع‌دهنده
  assignedToRole?: string;    // نقش کاربر دریافت‌کننده
  referredByRole?: string;    // نقش ارجاع‌دهنده
}


export interface ReferralCreateDto {
  CustomerId: number;       // CustomerId مشترک
  AssignedToId: string;     // کاربر گیرنده
  Note?: string;            // یادداشت اختیاری
  IsIndividual: boolean;    // حقیقی یا حقوقی
}

export interface ReferralHistoryDto {
  id: number;
  assignedTo: string;
  referredBy: string;
  referredAt: string;
  isRead: boolean;
  note?: string;
}


