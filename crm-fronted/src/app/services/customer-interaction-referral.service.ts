import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReferralCreateDto, CustomerInteractionReferral } from '../models/customer-interaction-referral.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerInteractionReferralService {

  private baseUrl = 'https://localhost:44386/api/CustomerInteractionReferral';

  constructor(private http: HttpClient) { }

  createReferral(dto: ReferralCreateDto): Observable<CustomerInteractionReferral> {
    return this.http.post<CustomerInteractionReferral>(`${this.baseUrl}`, dto);
  }

  getReferrals(interactionId: number): Observable<CustomerInteractionReferral[]> {
    return this.http.get<CustomerInteractionReferral[]>(`${this.baseUrl}/${interactionId}`);
  }

  // ✅ اضافه کردن متد برای گرفتن ارجاعات کاربر
  getReferralsByUser(userId: string): Observable<CustomerInteractionReferral[]> {
    return this.http.get<CustomerInteractionReferral[]>(`${this.baseUrl}/user/${userId}`);
  }
  markAsRead(referralId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${referralId}/mark-as-read`, {});
  }

  getReferralHistory(): Observable<CustomerInteractionReferral[]> {
    return this.http.get<CustomerInteractionReferral[]>(`${this.baseUrl}/referral-history`);
  }


}
