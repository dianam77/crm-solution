import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  public apiUrl = 'https://localhost:44386/api/invoice';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createInvoice(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
  }

  updateInvoice(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, formData, { headers: this.getAuthHeaders() });
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // ✅ PDF یک فاکتور
  getInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }


}
