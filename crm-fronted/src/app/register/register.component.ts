import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  username = '';
  password = '';
  email = '';
  roleName = '';
  roles: string[] = [];

  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles() {
    this.userService.getRoles().subscribe({
      next: roles => this.roles = roles,
      error: err => console.error('خطا در دریافت نقش‌ها:', err)
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.username, this.password, this.email, this.roleName).subscribe({
      next: (res: any) => {
        this.successMessage = res.message || 'کاربر با موفقیت ثبت شد';
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = 'خطا در ثبت نام';
        }
      }
    });
  }
}
