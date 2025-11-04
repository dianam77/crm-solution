import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  roles: string[] = []; 
  editingUserId: string | null = null;
  passwordEditUserId: string | null = null;
  passwordVisible = false;
  editCache: any = {};

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles() {
    this.userService.getRoles().subscribe({
      next: (response) => {
        this.roles = Array.isArray(response) ? response : [];
      },
      error: (err) => {
        console.error('خطا در دریافت نقش‌ها:', err);
      }
    });
  }

  toPersianDigits(value: any): string {
    if (value === null || value === undefined) return '-';
    return value.toString().replace(/[0-9]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
  }

  hasPermission(permission: string): boolean {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const permsRaw = decoded['permissions'] || '[]';
      const userPermissions: string[] = JSON.parse(permsRaw).map((p: string) => p.toLowerCase());
      return userPermissions.includes(permission.toLowerCase());
    } catch (err) {
      console.error('JWT decode error:', err);
      return false;
    }
  }

  loadUsers() {
    if (!this.hasPermission('users.getusers')) {
      console.warn('⛔ کاربر دسترسی مشاهده کاربران را ندارد.');
      this.users = [];
      return;
    }

    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = Array.isArray(response) ? response : [];
      },
      error: (err) => {
        console.error('خطا در بارگذاری کاربران:', err);
        this.users = [];
      }
    });
  }

  startEdit(user: User) {
    if (!this.hasPermission('users.edituser')) return;

    this.editingUserId = user.id;
    this.passwordEditUserId = null;
    this.passwordVisible = false;
    this.editCache = { ...user, password: '' };
  }

  cancelEdit() {
    this.editingUserId = null;
    this.editCache = {};
  }

  saveEdit(id: string) {
    if (!this.hasPermission('users.edituser')) return;

    const updatedUser = {
      id,
      userName: this.editCache.userName,
      email: this.editCache.email,
      role: this.editCache.role,
      password: '' 
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        this.loadUsers();
        this.cancelEdit();
      },
      error: () => alert('خطا در به‌روزرسانی اطلاعات کاربر')
    });
  }


  deleteUser(id: string) {
    if (!this.hasPermission('users.deleteuser')) return;
    if (!confirm('آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟')) return;

    this.userService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('خطا در حذف کاربر')
    });
  }


  startPasswordEdit(user: User) {
    if (!this.hasPermission('users.edituser')) return;

    this.passwordEditUserId = user.id;
    this.editingUserId = null;
    this.passwordVisible = false;
    this.editCache = { ...user, password: '' };
  }

  cancelPasswordChange() {
    this.passwordEditUserId = null;
    this.passwordVisible = false;
    this.editCache = {};
  }

  submitPasswordChange(userId: string) {
    if (!this.hasPermission('users.edituser')) return;

    if (!this.isPasswordValid()) {
      alert('رمز عبور باید حداقل یک حرف بزرگ و یک حرف کوچک داشته باشد.');
      return;
    }

    const updatedUser = {
      id: userId,
      userName: this.editCache.userName,
      email: this.editCache.email,
      role: this.editCache.role,
      password: this.editCache.password
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        this.loadUsers();
        this.cancelPasswordChange();
      },
      error: (err) => {
        console.error('خطا در تغییر رمز عبور:', err);
        alert('خطا در به‌روزرسانی رمز عبور');
      }
    });
  }


  passwordHasNoUppercase() {
    return this.editCache.password && !/[A-Z]/.test(this.editCache.password);
  }

  passwordHasNoLowercase() {
    return this.editCache.password && !/[a-z]/.test(this.editCache.password);
  }

  isPasswordValid() {
    return !this.passwordHasNoUppercase() && !this.passwordHasNoLowercase();
  }
}
