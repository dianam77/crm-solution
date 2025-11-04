import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const role = this.authService.getRole();
    const permissions = this.authService.getPermissions(); 

    if (!role) {
      this.router.navigate(['/login']);
      return false;
    }

    const path = route.routeConfig?.path || '';
    const requiredPermission: string | null = route.data?.['permission'] || null;

  
    if (role === 'Admin') return true;


    if (requiredPermission) {
      if (!permissions.includes(requiredPermission.toLowerCase())) {
        this.router.navigate(['/not-authorized']);
        return false;
      }
    } else {

      if (!permissions.includes(path.toLowerCase())) {
        this.router.navigate(['/not-authorized']);
        return false;
      }
    }

    return true;
  }
}
