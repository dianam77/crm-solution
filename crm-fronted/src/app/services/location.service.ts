import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { City } from '../models/City.model';
import { Province } from '../models/Province.model';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiBaseUrl = 'https://localhost:44386/api/CustomerIndividualApi';

  constructor(private http: HttpClient) { }

  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.apiBaseUrl}/provinces`);
  }

  getCities(provinceId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiBaseUrl}/cities/${provinceId}`);
  }
}
