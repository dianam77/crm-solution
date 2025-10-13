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
  roles: string[] = []; // نقش‌ها از API گرفته می‌شود
  currentRole = '';

  editingUserId: string | null = null;
  passwordEditUserId: string | null = null;
  passwordVisible = false;
  editCache: any = {};

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.setCurrentRole();
    this.loadRoles();
    this.loadUsers();
  }

  // گرفتن نقش کاربر لاگین شده از JWT
  setCurrentRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      this.currentRole = Array.isArray(roles) ? roles[0] : roles;
    } catch (err) {
      console.error('Invalid token', err);
      this.currentRole = '';
    }
  }

  // بارگذاری لیست نقش‌ها برای dropdown
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

  // بارگذاری کاربران
  loadUsers() {
    const loadMethod = this.currentRole === 'User'
      ? this.userService.getUserNames()
      : this.userService.getUsers();

    loadMethod.subscribe({
      next: (response) => {
        this.users = Array.isArray(response) ? response : [];
      },
      error: (err) => {
        console.error('خطا در بارگذاری کاربران:', err);
        this.users = [];
      }
    });
  }

  // شروع حالت ویرایش اطلاعات کاربر
  startEdit(user: User) {
    if (this.currentRole === 'User') return;

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
    if (this.currentRole === 'User') return;

    const updatedUser = {
      id,
      userName: this.editCache.userName,
      email: this.editCache.email,
      role: this.editCache.role,
      password: '' // بدون تغییر رمز
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        this.loadUsers();
        this.cancelEdit();
      },
      error: () => alert('خطا در به‌روزرسانی اطلاعات کاربر')
    });
  }

  // حذف کاربر
  deleteUser(id: string) {
    if (!['Admin', 'Manager'].includes(this.currentRole)) return;
    if (!confirm('آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟')) return;

    this.userService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('خطا در حذف کاربر')
    });
  }

  // شروع حالت تغییر رمز عبور
  startPasswordEdit(user: User) {
    if (this.currentRole === 'User') return;

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

  // ارسال تغییر رمز عبور
  submitPasswordChange(userId: string) {
    if (this.currentRole === 'User') return;

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

  // اعتبارسنجی رمز عبور
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
