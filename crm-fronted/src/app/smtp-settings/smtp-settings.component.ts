import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SmtpService } from '../services/Smtp.service';
import { SmtpSettings } from '../models/SmtpSettings.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-smtp-settings',
  templateUrl: './smtp-settings.component.html',
  styleUrls: ['./smtp-settings.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class SmtpSettingsComponent implements OnInit {
  smtpForm!: FormGroup;
  settings: SmtpSettings | null = null;
  formLoaded = false;
  showModal = false;

  constructor(private smtpService: SmtpService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.smtpForm = this.fb.group({
      displayName: ['', Validators.required],
      smtpServer: ['', [Validators.required, Validators.pattern(/^smtp\.[a-z0-9\-]+\.com$/i)]],
      smtpPort: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      senderEmail: ['', [Validators.required, Validators.email]],
      senderPassword: ['', Validators.required],
      enableSsl: [true],
      isActive: [true]
    });

    this.loadSettings();
  }

  loadSettings() {
    this.smtpService.getSettings().subscribe({
      next: res => {
        this.settings = res?.id && res.id > 0 ? res : null;
        this.formLoaded = true;
      },
      error: err => {
        if (err.status === 404) this.settings = null;
        else console.error(err);
        this.formLoaded = true;
      }
    });
  }

  openModal() {
    if (this.settings) this.smtpForm.patchValue(this.settings);
    else this.smtpForm.reset();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveSettings() {
    if (!this.formLoaded) {
      alert('لطفاً تا بارگذاری کامل فرم صبر کنید.');
      return;
    }

    if (this.smtpForm.invalid) {
      this.smtpForm.markAllAsTouched();
      const errors: string[] = [];
      const controls = this.smtpForm.controls;

      if (controls['displayName'].invalid) errors.push('نام نمایشی');
      if (controls['smtpServer'].invalid) errors.push('سرور SMTP (فرمت: smtp.example.com)');
      if (controls['smtpPort'].invalid) errors.push('پورت SMTP (عدد بین 1 تا 65535)');
      if (controls['senderEmail'].invalid) {
        if (controls['senderEmail'].errors?.['required']) errors.push('ایمیل فرستنده');
        else if (controls['senderEmail'].errors?.['email']) errors.push('فرمت ایمیل صحیح نیست');
      }
      if (controls['senderPassword'].invalid) errors.push('رمز عبور (App Password برای Gmail)');
      alert(`⚠️ لطفاً فیلدهای زیر را به درستی وارد کنید:\n- ${errors.join('\n- ')}`);
      return;
    }

    const data: SmtpSettings = {
      ...this.smtpForm.value,
      enableSsl: !!this.smtpForm.value.enableSsl,
      isActive: !!this.smtpForm.value.isActive
    };

    if (!this.settings) {
      this.smtpService.createSettings(data).subscribe({
        next: res => {
          this.settings = res;
          alert('✅ تنظیمات SMTP با موفقیت ایجاد شد.');
          this.closeModal();
        },
        error: err => this.handleApiError(err)
      });
    } else {
      data.id = this.settings.id;
      this.smtpService.updateSettings(data).subscribe({
        next: () => {
          this.settings = { ...this.settings!, ...data };
          alert('✅ تنظیمات SMTP با موفقیت بروزرسانی شد.');
          this.closeModal();
        },
        error: err => this.handleApiError(err)
      });
    }
  }

  private handleApiError(err: any) {
    if (err.status === 400 && err.error) {
      const fieldErrors = Object.keys(err.error)
        .map(k => `${k}: ${err.error[k].join(', ')}`)
        .join('\n');
      alert(`⚠️ لطفاً خطاهای زیر را اصلاح کنید:\n${fieldErrors}`);
    } else {
      alert('❌ خطا در ارتباط با سرور: ' + err.message);
    }
  }
}
