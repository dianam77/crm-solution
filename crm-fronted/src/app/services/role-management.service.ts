import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Permission } from '../models/permission.model';
import { Role } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private apiUrl = 'https://localhost:44386/api/rolemanagement';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  updateStatus(id: number, status: string) {

    return this.http.put(`${this.apiUrl}/${id}/status`, { status }, { headers: this.getHeaders() });
  }


  getPermissions(): Observable<Permission[]> {
   
    return this.http.get<Permission[]>(`${this.apiUrl}/permissions`, { headers: this.getHeaders() });
  }

  createPermission(data: { name: string; description: string }): Observable<Permission> {
    return this.http.post<Permission>(`${this.apiUrl}/permissions`, data, { headers: this.getHeaders() });
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`, { headers: this.getHeaders() });
  }

  createRole(data: { roleName: string; permissionIds: string[] }): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles`, data, { headers: this.getHeaders() });
  }
}
