// referral.model.ts
export enum ReferralStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Completed = 'Completed'
}

export enum ReferralPriority {
  Low = 0,
  Medium = 1,
  High = 2
}

export interface UserReferral {
  id: number;
  assignedById: string;
  assignedByName?: string;
  assignedToId: string;
  assignedToName?: string;

  notes?: string;
  status: ReferralStatus;
  priority: ReferralPriority;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateUserReferralDto {
  assignedById: string;
  assignedToId: string;
  notes?: string;
  priority: ReferralPriority;
}
