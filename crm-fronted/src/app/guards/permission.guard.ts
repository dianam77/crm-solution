import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);

    
      const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const userRoles = Array.isArray(roles)
        ? roles.map((r: string) => r.toLowerCase())
        : [roles.toLowerCase()];

 
      const permsRaw = decoded['permissions'] || '[]';
      const userPermissions = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());


      if (userRoles.includes('admin')) {
        return true;
      }


      const requiredPermission = route.data?.['permission'];
      if (!requiredPermission) {
        return true;
      }

      if (userPermissions.includes(requiredPermission.toLowerCase())) {
        return true;
      } else {
        console.warn(`⛔ دسترسی رد شد: نیاز به ${requiredPermission}`);
        this.router.navigate(['/not-authorized']);
        return false;
      }

    } catch (err) {
      console.error('JWT decode error:', err);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
