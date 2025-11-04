import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    if (!this.email.trim()) {
      this.errorMessage = 'لطفاً ایمیل خود را وارد کنید';
      return;
    }

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message || 'اگر ایمیل موجود باشد، لینک بازیابی ارسال می‌شود ✅';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'خطا در ارسال ایمیل ❌';
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
