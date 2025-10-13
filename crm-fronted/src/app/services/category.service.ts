import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = 'https://localhost:44386/api/categories';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // دریافت همه دسته‌بندی‌ها
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  // ایجاد دسته‌بندی جدید
  createCategory(category: Partial<Category>, token: string): Observable<Category> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<Category>(this.apiUrl, category, { headers });
  }


  // بروزرسانی دسته‌بندی
  updateCategory(id: string, category: { name: string; isActive: boolean }): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category, { headers: this.getAuthHeaders() });
  }


  // حذف دسته‌بندی
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
