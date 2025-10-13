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

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    console.log('Login data sending:', { Username: this.username, Password: this.password });

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Token received:', res.token);
        localStorage.setItem('jwtToken', res.token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = 'نام کاربری یا رمز عبور اشتباه است';
      }
    });
  }
}
