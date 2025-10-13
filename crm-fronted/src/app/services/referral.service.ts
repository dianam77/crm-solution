// referral.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserReferral, ReferralStatus, CreateUserReferralDto } from '../models/referral.model';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  private apiUrl = 'https://localhost:44386/api/UserReferral';

  constructor(private http: HttpClient) { }

  getAll(): Observable<UserReferral[]> {
    return this.http.get<UserReferral[]>(this.apiUrl);
  }

  getById(id: number): Observable<UserReferral> {
    return this.http.get<UserReferral>(`${this.apiUrl}/${id}`);
  }

  create(referral: CreateUserReferralDto) {
    return this.http.post<UserReferral>(this.apiUrl, referral);
  }

  updateStatus(id: number, status: ReferralStatus): Observable<UserReferral> {
    return this.http.put<UserReferral>(`${this.apiUrl}/${id}/status`, { status });
  }

  update(id: number, referral: Partial<CreateUserReferralDto>) {
    return this.http.put(`${this.apiUrl}/${id}`, referral);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
