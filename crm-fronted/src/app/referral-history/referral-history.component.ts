import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerInteractionReferralService } from '../services/customer-interaction-referral.service';
import { CustomerInteractionReferral } from '../models/customer-interaction-referral.model';
import { FormsModule } from '@angular/forms';
import moment from 'moment-jalaali';

@Component({
  selector: 'app-referral-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './referral-history.component.html',
  styleUrls: ['./referral-history.component.css'] // می‌توانید حذف کنید اگر فایل ندارید
})
export class ReferralHistoryComponent implements OnInit {

  referrals: CustomerInteractionReferral[] = [];

  constructor(private referralService: CustomerInteractionReferralService) { }

  ngOnInit(): void {
    moment.loadPersian({ usePersianDigits: true });
    this.loadReferrals();
  }

  loadReferrals(): void {
    this.referralService.getReferralHistory().subscribe({
      next: (res: CustomerInteractionReferral[]) => {
        this.referrals = res;
      },
      error: err => console.error('خطا در دریافت تاریخچه ارجاعات:', err)
    });
  }

  toJalali(date: any): string {
    if (!date) return '-';
    const m = moment(date).tz('Asia/Tehran');
    return m.isValid() ? m.format('HH:mm jYYYY/jMM/jDD') : '-';
  }

}
