import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MainCompany } from '../models/main-company.model';

@Injectable({
  providedIn: 'root'
})
export class MainCompanyService {
  private apiUrl = 'https://localhost:44386/api/MainCompany';

  constructor(private http: HttpClient) { }

  getAll(): Observable<MainCompany[]> {
    return this.http.get<MainCompany[]>(this.apiUrl);
  }

  getById(id: number): Observable<MainCompany> {
    return this.http.get<MainCompany>(`${this.apiUrl}/${id}`);
  }

  create(company: MainCompany): Observable<MainCompany> {
    return this.http.post<MainCompany>(this.apiUrl, company);
  }

  update(id: number, company: MainCompany): Observable<MainCompany> {
    return this.http.put<MainCompany>(`${this.apiUrl}/${id}`, company);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
