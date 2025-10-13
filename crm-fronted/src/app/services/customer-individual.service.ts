import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CustomerIndividual } from '../models/customer-individual.model';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerIndividualService {
  private apiUrl = 'https://localhost:44386/api/CustomerIndividualApi';

  constructor(private http: HttpClient) { }

  getAll(): Observable<CustomerIndividual[]> {
    return this.http.get<CustomerIndividual[]>(this.apiUrl).pipe(
      map(customers =>
        customers.map(c => ({
          ...c,
          fullName: `${c.firstName} ${c.lastName}`.trim()
        }))
      )
    );
  }

  getById(id: number): Observable<CustomerIndividual> {
    return this.http.get<CustomerIndividual>(`${this.apiUrl}/${id}`).pipe(
      map(c => ({
        ...c,
        fullName: `${c.firstName} ${c.lastName}`.trim()
      }))
    );
  }

  create(customer: CustomerIndividual): Observable<any> {
    return this.http.post(this.apiUrl, customer);
  }

  update(id: number, customer: CustomerIndividual): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, customer);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
