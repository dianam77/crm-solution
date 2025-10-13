import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerCompany } from '../models/customer-company.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerCompanyService {
  private apiUrl = 'https://localhost:44386/api/CustomerCompanyApi';

  constructor(private http: HttpClient) { }

  getAll(): Observable<CustomerCompany[]> {
    return this.http.get<CustomerCompany[]>(this.apiUrl);
  }

  getById(id: number): Observable<CustomerCompany> {
    return this.http.get<CustomerCompany>(`${this.apiUrl}/${id}`);
  }

  create(company: CustomerCompany): Observable<CustomerCompany> {
    return this.http.post<CustomerCompany>(this.apiUrl, company);
  }

  update(id: number, company: CustomerCompany): Observable<CustomerCompany> {
    return this.http.put<CustomerCompany>(`${this.apiUrl}/${id}`, company);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
