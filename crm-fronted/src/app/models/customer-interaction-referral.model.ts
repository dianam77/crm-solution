export interface CustomerInteractionReferral {
  id: number;
  interactionId: number;

  referredById?: string;
  referredByName?: string;
  referredAt?: string;
  note?: string;

  isRead?: boolean;

  // 👇 این دو مقدار برای نمایش در HTML لازم هستند
  assignedToName?: string;
  isActive?: boolean;
}


export interface ReferralCreateDto {
  interactionId: number;
  assignedToId: string;
  note?: string;
}
