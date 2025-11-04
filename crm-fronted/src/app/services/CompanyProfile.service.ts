import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyProfile } from '../models/CompanyProfile';

@Injectable({
  providedIn: 'root'
})
export class CompanyProfileService {
  private apiUrl = 'https://localhost:44386/api/companyprofile'; 

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getProfile(): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  createProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    return this.http.post<CompanyProfile>(this.apiUrl, profile, { headers: this.getAuthHeaders() });
  }

  updateProfile(profile: CompanyProfile): Observable<any> {
    if (!profile.id) throw new Error('Profile ID is required for update');
    return this.http.put(`${this.apiUrl}/${profile.id}`, profile, { headers: this.getAuthHeaders() });
  }
}
