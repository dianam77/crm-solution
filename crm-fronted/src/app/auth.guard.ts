// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: any): boolean {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const userRole = Array.isArray(roles) ? roles[0] : roles;

      // Admin اجازه همه مسیرها را دارد
      if (userRole === 'Admin') return true;

      // Manager فقط مسیرهای مشخص
      const allowedForManager = [
        '/users/manage',
        '/customer-individual',
        '/customer-company'
      ];

      if (userRole === 'Manager' && allowedForManager.includes(route.url[0].path)) {
        return true;
      }

      this.router.navigate(['/not-authorized']);
      return false;

    } catch (error) {
      this.router.navigate(['/login']);
      return false;
    }
  }
}

