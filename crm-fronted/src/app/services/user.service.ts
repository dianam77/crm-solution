import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:44386/api/users';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // توکن JWT
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // فقط اسامی کاربران برای همه نقش‌ها
  getUserNames(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/names`, { headers: this.getAuthHeaders() });
  }

  // عملیات فقط برای Admin و Manager
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  updateUser(user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/${user.id}`, user, { headers: this.getAuthHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // لیست نقش‌ها فقط برای Admin
  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`, { headers: this.getAuthHeaders() });
  }
}
