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
      smtpServer: ['', Validators.required],
      smtpPort: [null, Validators.required],
      senderEmail: ['', [Validators.required, Validators.email]],
      senderPassword: ['', Validators.required],
      enableSsl: [false],
      isActive: [false]
    });

    this.loadSettings();
  }

  loadSettings() {
    this.smtpService.getSettings().subscribe({
      next: res => {
   
        if (!res || !res.id || res.id === 0) {
          this.settings = null;
        } else {
          this.settings = res;
        }
        this.formLoaded = true;
      },
      error: err => {
        if (err.status === 404) {
          this.settings = null;
        } else {
          console.error(err);
        }
        this.formLoaded = true;
      }
    });
  }

  openModal() {
    if (this.settings) {
      this.smtpForm.patchValue(this.settings);
    } else {
      this.smtpForm.reset();
    }
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
      alert('⚠️ لطفاً تمام فیلدهای ضروری را پر کنید و مقادیر معتبر وارد نمایید.');
      return;
    }

    const data: SmtpSettings = this.smtpForm.value;


    if (!this.settings) {
      this.smtpService.createSettings(data).subscribe({
        next: res => {
          this.settings = res;
          alert('✅ تنظیمات SMTP با موفقیت ایجاد شد.');
          this.closeModal();
        },
        error: err => {
          alert('❌ خطا در ایجاد تنظیمات: ' + err.message);
        }
      });
    } else {

      data.id = this.settings.id;
      this.smtpService.updateSettings(data).subscribe({
        next: () => {
          this.settings = { ...this.settings!, ...data };
          alert('✅ تنظیمات SMTP با موفقیت بروزرسانی شد.');
          this.closeModal();
        },
        error: err => {
          alert('❌ خطا در بروزرسانی تنظیمات: ' + err.message);
        }
      });
    }
  }


  }
