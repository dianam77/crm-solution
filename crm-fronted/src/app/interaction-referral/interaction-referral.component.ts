import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CustomerInteractionReferral,
  ReferralCreateDto
} from '../models/customer-interaction-referral.model';

import { User } from '../models/user.model';
import { Role } from '../models/role.model';

import { CustomerInteractionReferralService } from '../services/customer-interaction-referral.service';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-interaction-referral',
  templateUrl: './interaction-referral.component.html',
  styleUrls: ['./interaction-referral.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class InteractionReferralComponent implements OnInit {

  interactionId!: number;

  referrals: CustomerInteractionReferral[] = [];
  referralNote: string = '';
  referralAssignedToId: string = '';

  allUsers: User[] = [];
  users: User[] = [];
  roles: Role[] = [];
  selectedRole: string = '';

  // 👇 اضافه شده برای شناسایی کاربر لاگین‌شده
  currentUserId: string | null = null;

  constructor(
    private referralService: CustomerInteractionReferralService,
    private userService: UserService,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 📌 دریافت ID تعامل از URL
    this.interactionId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.interactionId) {
      console.error("❌ interactionId در URL پیدا نشد!");
      return;
    }

    // 📌 گرفتن ID کاربر لاگین‌شده از localStorage
    this.currentUserId = localStorage.getItem('userId');

    this.loadRoles();
    this.loadUsers();
    this.loadReferrals();
  }

  // 📌 دریافت نقش‌ها
  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: res => this.roles = res,
      error: err => console.error('Error loading roles:', err)
    });
  }

  // 📌 دریافت کاربران
  loadUsers(): void {
    this.userService.getCurrentUser().subscribe({
      next: current => {

        this.currentUserId = current.id;   // 👈 کاربر واقعی، نه از localStorage

        this.userService.getUsers().subscribe({
          next: res => {
            this.allUsers = res;
            this.applyRoleFilter();        // 👈 بعد از دریافت currentUser
          },
          error: err => console.error('Error loading users:', err)
        });

      },
      error: err => console.error('Error loading current user:', err)
    });
  }




  // 📌 انتخاب نقش برای فیلتر کاربران
  onRoleChange(): void {
    this.applyRoleFilter();
    this.referralAssignedToId = '';
  }

  // 📌 فقط کاربران نقش انتخاب‌شده نمایش داده می‌شوند + کاربر لاگین‌شده حذف می‌شود
  private applyRoleFilter(): void {
    if (!this.selectedRole) {
      this.users = [];
      return;
    }

    this.users = this.allUsers
      .filter(u => u.role === this.selectedRole)
      .filter(u => u.id !== this.currentUserId);  // حذف خودش
  }


  // 📌 لود ارجاعات ثبت‌شده
  loadReferrals(): void {
    if (!this.interactionId) return;

    this.referralService.getReferrals(this.interactionId).subscribe({
      next: res => this.referrals = res,
      error: err => console.error('Error loading referrals:', err)
    });
  }

  // 📌 ثبت ارجاع جدید
  createReferral(): void {
    if (!this.interactionId || !this.referralAssignedToId) {
      alert("لطفاً همه فیلدهای مورد نیاز را پر کنید");
      return;
    }

    const dto: ReferralCreateDto = {
      interactionId: Number(this.interactionId),
      assignedToId: this.referralAssignedToId,
      note: this.referralNote
    };

    console.log("📌 Payload sent to backend:", dto);

    this.referralService.createReferral(dto).subscribe({
      next: () => {
        alert('ارجاع با موفقیت ثبت شد');
        this.router.navigate(['/customer-interaction']);
      },
      error: err => {
        console.error('Error creating referral:', err);
        alert('خطا در ثبت ارجاع.');
      }
    });
  }
}
