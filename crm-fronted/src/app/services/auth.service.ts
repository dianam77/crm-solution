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

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const name = this.getNameFromToken(token);
      this.currentUserSubject.next(name);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.homeUrl}/login`, { Username: username, Password: password })
      .pipe(
        tap(res => {
          localStorage.setItem('jwtToken', res.token);
          const name = this.getNameFromToken(res.token);
          this.currentUserSubject.next(name);
        })
      );
  }

  register(username: string, password: string, email: string, roleName: string): Observable<any> {
    return this.http.post<any>(`${this.homeUrl}/register`, { Username: username, Password: password, Email: email, RoleName: roleName });
  }

  logout() {
    localStorage.removeItem('jwtToken');
    this.currentUserSubject.next(null);
  }

  getCurrentUserName(): string | null {
    return this.currentUserSubject.value;
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

  getRole(): string | null {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    const decoded = this.decodeToken(token);
    return decoded?.role || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  }
}
