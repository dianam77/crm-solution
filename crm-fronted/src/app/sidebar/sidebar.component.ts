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
  permission?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  roles: string[] = [];
  userPermissions: string[] = [];
  navLinks: NavLink[] = [];

  constructor(private authService: AuthService, public router: Router) { }

  ngOnInit(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);

      const rolesRaw = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      this.roles = Array.isArray(rolesRaw) ? rolesRaw.map(r => r.toLowerCase()) : [rolesRaw.toLowerCase()];

      const permsRaw = decoded['permissions'] || '[]';
      this.userPermissions = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());

      this.initializeNavLinks();
      this.filterLinksByPermissions();
    } catch (err) {
      console.error('JWT decode error', err);
    }
  }

  private initializeNavLinks(): void {
    this.navLinks = [
   
      { label: 'داشبورد', path: '/dashboard', icon: 'home' },

      {
        label: 'مدیریت کاربران',
        icon: 'users',
        children: [
          { label: 'ثبت نام کاربران', path: '/register', icon: 'user-plus', permission: 'users.create' },
          { label: 'مدیریت کاربران', path: '/users/manage', icon: 'user-cog', permission: 'users.getusers' },
          { label: 'مدیریت نقش‌ها', path: '/roles/manage', icon: 'user-shield', permission: 'users.getroles' },
        ]
      },

      {
        label: 'اطلاعات پایه',
        icon: 'industry',
        children: [
          { label: 'ثبت شرکت', path: '/main-company', icon: 'plus', permission: 'maincompany.create' },
          { label: 'تنظیمات SMTP', path: '/smtp-settings', icon: 'envelope', permission: 'smtp.getsettings' } 
        ]
      },

      {
        label: 'مدیریت مشتریان',
        icon: 'address-book',
        children: [
          { label: 'مدیریت مشتریان حقیقی', path: '/customer-individual', icon: 'id-card', permission: 'customerindividualapi.getall' },
          { label: 'مدیریت مشتریان حقوقی', path: '/customer-company', icon: 'building', permission: 'customercompanyapi.getcompanies' },
          { label: 'تعاملات مشتریان', path: '/customer-interaction', icon: 'comments', permission: 'customerinteraction.getall' }
        ]
      },

      {
        label: 'مدیریت محصولات و خدمات',
        icon: 'box-open',
        children: [
          { label: 'مدیریت محصولات', path: '/products/manage', icon: 'boxes', permission: 'products.getproducts' },
          { label: 'مدیریت دسته‌بندی‌ها', path: '/categories/manage', icon: 'tags', permission: 'categories.getcategories' },
        ]
      },

      {
        label: 'فاکتورها و پیش‌فاکتورها',
        icon: 'file-invoice-dollar',
        children: [
          { label: 'لیست فاکتورها', path: '/invoices', icon: 'list', permission: 'invoice.getall' },
        ]
      }
    ];
  }

  private filterLinksByPermissions(): void {
  
    if (this.roles.includes('admin')) return;

    this.navLinks = this.navLinks
      .map(link => {
        if (link.children) {
          const allowedChildren = link.children.filter(c =>
            !c.permission || this.userPermissions.includes(c.permission.toLowerCase())
          );
          return allowedChildren.length > 0 ? { ...link, children: allowedChildren } : null;
        } else {
          if (link.permission && !this.userPermissions.includes(link.permission.toLowerCase())) return null;
          return link;
        }
      })
      .filter((link): link is NavLink => link !== null);
  }

  toggleDropdown(link: NavLink): void {
    this.navLinks.forEach(l => {
      if (l !== link) l.showChildren = false;
    });
    link.showChildren = !link.showChildren;
  }
}
