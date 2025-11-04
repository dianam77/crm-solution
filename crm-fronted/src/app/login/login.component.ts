import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  passwordVisible = false;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    console.log('Login data sending:', { Username: this.username, Password: this.password });

    localStorage.removeItem('jwtToken');

    this.authService.login(this.username, this.password).subscribe({
      next: (res: any) => {
        if (!res.token) {
          console.error('Token not received from server');
          this.errorMessage = 'خطا در دریافت توکن';
          return;
        }

   
        localStorage.setItem('jwtToken', res.token);
        console.log('New token saved in localStorage:', localStorage.getItem('jwtToken'));

      
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = 'نام کاربری یا رمز عبور اشتباه است';
      }
    });

  }

  onForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }


}
