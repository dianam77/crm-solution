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

  getAll(): Observable<CustomerInteraction[]> {
    return this.http.get<CustomerInteraction[]>(this.apiUrl);
  }

  getById(id: number | string): Observable<CustomerInteraction> {
    return this.http.get<CustomerInteraction>(`${this.apiUrl}/${encodeURIComponent(String(id))}`);
  }

  create(interaction: FormData): Observable<CustomerInteraction> {
    return this.http.post<CustomerInteraction>(this.apiUrl, interaction);
  }

  update(id: number | string, interaction: FormData): Observable<CustomerInteraction> {
    return this.http.put<CustomerInteraction>(`${this.apiUrl}/${encodeURIComponent(String(id))}`, interaction);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(String(id))}`);
  }


  getProductsByCategory(categoryId: string): Observable<{ id: string, name: string }[]> {
    return this.http.get<{ id: string, name: string }[]>(`${this.apiUrl}/by-category?categoryId=${categoryId}`);
  }
}
