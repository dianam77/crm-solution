export interface CustomerInteractionReferral {
  id: number;
  interactionId: number;
  interactionType?: number; // ✅ اضافه شد

  referredById?: string;
  assignedToId?: string;

  referredByName?: string;
  assignedToName?: string;

  referredAt?: string;
  note?: string;

  isRead?: boolean;
  isActive?: boolean;
}

export interface ReferralCreateDto {
  interactionId: number;
  assignedToId: string;
  note?: string;
}
