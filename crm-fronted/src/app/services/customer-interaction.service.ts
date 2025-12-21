import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerInteraction } from '../models/customer-interaction.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerInteractionService {
  private apiUrl = 'https://localhost:44386/api/CustomerInteraction';

  constructor(private http: HttpClient) { }

  // ================= Get =================
  getAll(): Observable<CustomerInteraction[]> {
    return this.http.get<CustomerInteraction[]>(this.apiUrl);
  }

  getById(id: number | string): Observable<CustomerInteraction> {
    return this.http.get<CustomerInteraction>(`${this.apiUrl}/${encodeURIComponent(String(id))}`);
  }

  // ================ Create ================
  create(formData: FormData): Observable<CustomerInteraction> {
    return this.http.post<CustomerInteraction>(this.apiUrl, formData);
  }

  // ================ Update ================
  update(id: number | string, formData: FormData): Observable<CustomerInteraction> {
    return this.http.put<CustomerInteraction>(
      `${this.apiUrl}/${encodeURIComponent(String(id))}`,
      formData
    );
  }

  // ================ Delete ================
  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(String(id))}`);
  }

  // ================ Categories + Products ================
  getCategoriesWithProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories-with-products`);
  }


  // ================ 🔥 متد جدید: گرفتن مالکیت تعامل ================
  claimOwnership(interactionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/claim/${interactionId}`, {});
  }
  updateIsActive(id: number, isActive: boolean): Observable<any> {
    // مطمئن می‌شویم مقدار Boolean واقعی ارسال می‌شود
    const payload = { isActive: !!isActive };
    return this.http.put(`${this.apiUrl}/${id}/status`, payload, {
      headers: { 'Content-Type': 'application/json' }  // الزامی برای ASP.NET Core
    });
  }
  getMyInteractions(): Observable<CustomerInteraction[]> {
    return this.http.get<CustomerInteraction[]>(`${this.apiUrl}/my`);
  }


  getActiveByCustomer(customerId: number, customerType: 'individual' | 'company') {
    return this.http.get(
      `${this.apiUrl}/active-by-customer`,
      {
        params: {
          customerId,
          customerType
        }
      }
    );
  }




}

