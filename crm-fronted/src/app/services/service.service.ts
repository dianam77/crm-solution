import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private apiUrl = 'https://localhost:44386/api/services';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  createService(service: Service): Observable<Service> {
    return this.http.post<Service>(this.apiUrl, service, { headers: this.getAuthHeaders() });
  }

  updateService(service: Service): Observable<any> {
    return this.http.put(`${this.apiUrl}/${service.id}`, service, { headers: this.getAuthHeaders() });
  }

  deleteService(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
