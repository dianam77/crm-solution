import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private homeUrl = 'https://localhost:44386/api/home';
  

  private currentUserSubject = new BehaviorSubject<string | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private roleSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      this.updateUserDataFromToken(token);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.homeUrl}/login`, { Username: username, Password: password })
      .pipe(
        tap(res => {
          localStorage.setItem('jwtToken', res.token);
          this.updateUserDataFromToken(res.token);
        })
      );
  }

  register(username: string, password: string, email: string, roleName: string): Observable<any> {
    return this.http.post<any>(`${this.homeUrl}/register`, { username, Password: password, Email: email, RoleName: roleName });
  }

  logout() {
    localStorage.removeItem('jwtToken');
    this.currentUserSubject.next(null);
    this.roleSubject.next(null);
  }

  getCurrentUserName(): string | null {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.roleSubject.value;
  }

  getPermissions(): string[] {
    const token = localStorage.getItem('jwtToken');
    if (!token) return [];
    
    const decoded = this.decodeToken(token);
    if (!decoded?.permissions) return [];

    try {
      return JSON.parse(decoded.permissions).map((p: string) => p.trim().toLowerCase());
    } catch {
      return [];
    }
  }
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.homeUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.homeUrl}/reset-password`, { email, token, newPassword });
  }


  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission.toLowerCase());
  }


  private decodeToken(token: string): any {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private getNameFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.name
      || decoded?.unique_name
      || decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      || null;
  }

  private getRoleFromToken(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.role
      || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || null;
  }

  private updateUserDataFromToken(token: string) {
    const name = this.getNameFromToken(token);
    const role = this.getRoleFromToken(token);
    this.currentUserSubject.next(name);
    this.roleSubject.next(role);
  }
}
