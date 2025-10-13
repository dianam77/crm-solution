import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'https://localhost:44386/api/products';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // دریافت همه محصولات
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  // دریافت محصول خاص
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // ایجاد محصول یا خدمت جدید
  createProduct(formData: FormData): Observable<Product> {
    // توجه: Content-Type خودکار توسط مرورگر تنظیم می‌شود
    return this.http.post<Product>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
  }

  // بروزرسانی محصول یا خدمت
  updateProduct(id: string, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData, { headers: this.getAuthHeaders() });
  }

  // حذف محصول یا خدمت
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
