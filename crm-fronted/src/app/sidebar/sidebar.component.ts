import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavLink {
  label: string;
  path?: string;
  icon?: string; 
  children?: NavLink[];
  showChildren?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  role: string = '';
  navLinks: NavLink[] = [];

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      this.role = Array.isArray(roles) ? roles[0] : roles;

      this.initializeNavLinks();
    } catch (err) {
      console.error('خطا در decode کردن توکن JWT', err);
    }
  }

  private initializeNavLinks(): void {
    if (this.role === 'Admin' || this.role === 'Manager') {
      this.navLinks = [
        {
          label: 'داشبورد',
          path: '/dashboard',
        },
        {
          label: 'مدیریت کاربران',
          icon: 'users',
          children: this.role === 'Admin'
            ? [
              { label: 'ثبت نام کاربران', path: '/register', icon: 'user-plus' },
              { label: 'مدیریت کاربران', path: '/users/manage', icon: 'user-cog' },
            ]
            : [{ label: 'مدیریت کاربران', path: '/users/manage', icon: 'user-cog' },
             
            ],
          showChildren: false
        },
        {
          label: 'اطلاعات پایه',
          icon: 'industry',
          children: [
            { label: 'ثبت شرکت', path: '/main-company', icon: 'plus' } // ← لینک فرعی اضافه شد
          ],
          showChildren: false
        },
        {
          label: 'مدیریت مشتریان',
          icon: 'address-book',
          children: [
            { label: 'مدیریت مشتریان حقیقی', path: '/customer-individual', icon: 'id-card' },
            { label: 'مدیریت مشتریان حقوقی', path: '/customer-company', icon: 'building' },
            { label: 'تعاملات مشتریان', path: '/customer-interaction', icon: 'comments' }
          ],
          showChildren: false
        },
        {
          label: 'مدیریت محصولات و خدمات',
          icon: 'box-open',
          children: [
            { label: 'مدیریت محصولات', path: '/products/manage', icon: 'boxes' },
            { label: 'مدیریت دسته‌بندی‌ها', path: '/categories/manage', icon: 'tags' },
          ],
          showChildren: false
        },
        {
          label: 'فاکتورها و پیش‌فاکتورها',
          icon: 'file-invoice-dollar',
          children: [
            { label: 'لیست فاکتورها', path: '/invoices', icon: 'list' },
          ],
          showChildren: false
        }
      ];
    }
 else if (this.role === 'User') {
      this.navLinks = [
        {
          label: 'مدیریت مشتریان',
          icon: 'address-book',
          children: [
            { label: 'مدیریت مشتریان حقیقی', path: '/customer-individual', icon: 'id-card' },
            { label: 'مدیریت مشتریان حقوقی', path: '/customer-company', icon: 'building' }
          ],
          showChildren: false
        }
      ];
    }
  }

  toggleDropdown(link: NavLink): void {
    this.navLinks.forEach(l => {
      if (l !== link) l.showChildren = false;
    });
    link.showChildren = !link.showChildren;
  }

 
}
