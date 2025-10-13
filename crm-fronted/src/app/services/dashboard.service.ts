import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) { }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getRecentInvoices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/recent-invoices`);
  }

  getCharts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/charts`);
  }
}
