import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
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
      let userRole = '';
      if (roles) {
        userRole = Array.isArray(roles) ? roles[0] : roles;
      }

      const path = route.routeConfig?.path;

      // مسیرهای مجاز برای مشاهده (view) و ویرایش (edit)
      const rolePaths: { [key: string]: { view: string[], edit: string[] } } = {
        'Admin': { view: ['*'], edit: ['*'] }, // Admin همه مسیرها
        'Manager': {
          view: ['users/manage', 'customer-individual', 'customer-company'],
          edit: ['users/manage', 'customer-individual', 'customer-company']
        },
        'User': {
          view: ['customer-individual', 'customer-company'],
          edit: [] // User نمی‌تواند ویرایش یا حذف کند
        }
      };

      const paths = rolePaths[userRole];
      if (!paths) {
        this.router.navigate(['/login']);
        return false;
      }

      // فقط مسیرهای view اجازه داده شده
      if (paths.view.includes('*') || (path && paths.view.includes(path))) {
        return true;
      }

      // مسیر غیرمجاز
      this.router.navigate(['/not-authorized']);
      return false;

    } catch (error) {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
