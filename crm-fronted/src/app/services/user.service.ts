import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:44386/api/users';
  private permissions: string[] = [];

  constructor(private http: HttpClient) {
    this.loadPermissions();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private loadPermissions() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const permsRaw = decoded['permissions'] || '[]';
      this.permissions = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());
    } catch (err) {
      console.error('JWT decode error:', err);
      this.permissions = [];
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission.toLowerCase());
  }


  getUserNames(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/names`, { headers: this.getAuthHeaders() });
  }

  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  updateUser(user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/${user.id}`, user, { headers: this.getAuthHeaders() });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`, { headers: this.getAuthHeaders() });
  }
}
