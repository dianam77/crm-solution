import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerInteractionReferral } from '../models/customer-interaction-referral.model';
import {
  ReferralCreateDto,
  ReferralHistoryDto
} from '../models/customer-interaction-referral.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerInteractionReferralService {

  private baseUrl = 'https://localhost:44386/api/customerinteractionreferral';

  constructor(private http: HttpClient) { }

  createCustomerReferral(dto: ReferralCreateDto): Observable<void> {
    return this.http.post<void>(
      'https://localhost:44386/api/customerinteractionreferral/by-customer',
      dto
    );
  }


  // ================== CUSTOMER REFERRALS ======
  getCustomerReferrals(
    customerId: number,
    isIndividual: boolean
  ): Observable<ReferralHistoryDto[]> {
    // مسیر get باید هم با Backend هماهنگ شود
    return this.http.get<ReferralHistoryDto[]>(`${this.baseUrl}/referral-history?customerId=${customerId}&isIndividual=${isIndividual}`);
  }

  // ================== USER REFERRALS ==========
  getReferralsByUser(): Observable<CustomerInteractionReferral[]> {
    return this.http.get<CustomerInteractionReferral[]>(`${this.baseUrl}/my-referrals`);
  }


  // ================== HISTORY (ADMIN) =========
  getReferralHistory(): Observable<CustomerInteractionReferral[]> {
    return this.http.get<CustomerInteractionReferral[]>(`${this.baseUrl}/referral-history`);
  }

  // ================== MARK AS READ ============
  markAsRead(referralId: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${referralId}/mark-as-read`,
      {}
    );
  }
}
