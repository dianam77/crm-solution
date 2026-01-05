import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  ReferralCreateDto,
  ReferralHistoryDto
} from '../models/customer-interaction-referral.model';

import { User } from '../models/user.model';
import { Role } from '../models/role.model';

import { CustomerInteractionReferralService } from '../services/customer-interaction-referral.service';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';

@Component({
  selector: 'app-interaction-referral',
  standalone: true,
  templateUrl: './interaction-referral.component.html',
  styleUrls: ['./interaction-referral.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class InteractionReferralComponent implements OnInit {

  // =================== Customer ===================
  customerId!: number;
  isIndividualCustomer = true;

  // =================== Referrals ==================
  referrals: ReferralHistoryDto[] = [];

  referralNote = '';
  referralAssignedToId = '';

  // =================== Users & Roles ==============
  allUsers: User[] = [];
  users: User[] = [];
  roles: Role[] = [];
  selectedRole = '';

  currentUserId!: string;

  constructor(
    private referralService: CustomerInteractionReferralService,
    private userService: UserService,
    private roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  // =================== Init =======================
  ngOnInit(): void {
    // از queryParams بخوان
    const customerIdParam = this.route.snapshot.queryParamMap.get('customerId');
    const typeParam = this.route.snapshot.queryParamMap.get('customerType');

    if (!customerIdParam) {
      console.error('❌ customerId پیدا نشد');
      return;
    }

    this.customerId = Number(customerIdParam);
    this.isIndividualCustomer = typeParam === 'individual';

    console.log('✅ customer resolved:', {
      customerId: this.customerId,
      isIndividual: this.isIndividualCustomer
    });

    this.loadRoles();
    this.loadUsers();
    this.loadReferrals();
  }


  // =================== Roles ======================
  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res: Role[]) => this.roles = res,
      error: (err: any) => console.error('Error loading roles:', err)
    });
  }

  // =================== Users ======================
  loadUsers(): void {
    this.userService.getCurrentUser().subscribe({
      next: (current: User) => {
        this.currentUserId = current.id;

        this.userService.getUsers().subscribe({
          next: (res: User[]) => {
            this.allUsers = res;
            this.applyRoleFilter();
          },
          error: (err: any) => console.error('Error loading users:', err)
        });
      },
      error: (err: any) => console.error('Error loading current user:', err)
    });
  }

  onRoleChange(): void {
    this.applyRoleFilter();
    this.referralAssignedToId = '';
  }

  private applyRoleFilter(): void {
    if (!this.selectedRole) {
      this.users = [];
      return;
    }

    this.users = this.allUsers
      .filter(u => u.role === this.selectedRole)
      .filter(u => u.id !== this.currentUserId);
  }

  // =================== Load Referrals =============
  loadReferrals(): void {
    this.referralService
      .getCustomerReferrals(this.customerId, this.isIndividualCustomer)
      .subscribe({
        next: (res: ReferralHistoryDto[]) => {
          this.referrals = res;
        },
        error: (err: any) => {
          console.error('Error loading referrals:', err);
        }
      });
  }



  createReferral(): void {
    if (!this.customerId || !this.referralAssignedToId) {
      alert('لطفاً همه فیلدها را تکمیل کنید');
      return;
    }

    const dto: ReferralCreateDto = {
      CustomerId: this.customerId,
      AssignedToId: this.referralAssignedToId,
      Note: this.referralNote || '',
      IsIndividual: this.isIndividualCustomer
    };

    console.log('📤 referral dto:', dto);

    this.referralService.createCustomerReferral(dto).subscribe({
      next: () => {
        alert('✅ ارجاع با موفقیت ثبت شد');

        // ⚡ هدایت به داشبورد به جای تعاملات
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.error('Error creating referral:', err);
        alert('خطا در ثبت ارجاع');
      }
    });
  }





}
