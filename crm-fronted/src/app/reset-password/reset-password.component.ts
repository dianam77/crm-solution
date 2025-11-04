import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (email && token) {
      this.resetForm.patchValue({ email, token });
    } else {
      this.error = 'لینک معتبر نیست یا منقضی شده است.';
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    this.loading = true;
    this.message = '';
    this.error = '';

    this.http.post('https://localhost:44386/api/home/reset-password', this.resetForm.value)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          alert(res.message);          
          this.router.navigate(['/login']); 
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error.message || 'خطای سرور';
        }
      });
  }

}
