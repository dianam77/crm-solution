import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://localhost:44386/api/products';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

 
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  
  getProductById(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }


  getByCategory(categoryId: string | number): Observable<Product[]> {
    return this.http.get<{ products: Product[] }>(`${this.apiUrl}?categoryId=${categoryId}`, { headers: this.getAuthHeaders() })
      .pipe(map(res => res.products));
  }


  createProduct(formData: FormData): Observable<Product> {
  
    return this.http.post<Product>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
  }


  updateProduct(id: string | number, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData, { headers: this.getAuthHeaders() });
  }


  deleteProduct(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
