// navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

import { ReferralService } from '../services/referral.service';
import { UserService } from '../services/user.service';
import { ChatService } from '../services/ChatService';
import { UserReferral, CreateUserReferralDto, ReferralPriority, ReferralStatus } from '../models/referral.model';
import { User } from '../models/user.model';
import { ChatMessage, CreateChatMessageDto } from '../models/ChatMessage';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  navbarCollapsed = false;
  searchVisible = false;
  darkMode = false;
  referralPanelVisible = false;
  messagesOpen = false;
  showCreateForm = false;
  receiversOpen = false;

  currentUser?: User;
  users: User[] = [];

  messages: ChatMessage[] = [];
  unreadCount = 0;
  newMessageContent = '';
  currentReceiverIds: string[] = [];

  referrals: UserReferral[] = [];
  newReferral: CreateUserReferralDto & { status?: ReferralStatus } = {
    assignedById: '',
    assignedToId: '',
    notes: '',
    priority: ReferralPriority.Medium,
    status: ReferralStatus.Pending
  };
  isEditMode = false;
  editingReferralId?: number;

  statusEnum = ReferralStatus;
  priorityEnum = ReferralPriority;

  statusLabels: { [key: string]: string } = {
    'Pending': 'در انتظار',
    'Accepted': 'قبول شده',
    'Rejected': 'رد شده',
    'Completed': 'تکمیل شده'
  };

  priorityLabels: { [key: string]: string } = {
    'Low': 'کم',
    'Medium': 'متوسط',
    'High': 'زیاد'
  };

  constructor(
    private referralService: ReferralService,
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.setCurrentUser();
    this.loadUsers();
  }

  private loadUsers(): void {
    const loader = this.currentUser?.role === 'User'
      ? this.userService.getUserNames()
      : this.userService.getUsers();

    loader.subscribe(users => {
      this.users = users.map(u => ({ ...u, id: u.id.toString(), email: '', role: u.role || '' }));
      this.loadMessages();
      this.loadReferrals();
    }, error => console.error('خطا در دریافت کاربران:', error));
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
  toggleNavbar(): void { this.navbarCollapsed = !this.navbarCollapsed; }
  toggleSearch(): void { this.searchVisible = !this.searchVisible; }
  toggleTheme(): void { this.darkMode = !this.darkMode; }
  toggleReferralPanel(): void { this.referralPanelVisible = !this.referralPanelVisible; if (this.referralPanelVisible) this.loadReferrals(); }
  toggleReceiverList(): void { this.receiversOpen = !this.receiversOpen; }
  toggleMessages(): void { this.messagesOpen = !this.messagesOpen; }

  loadMessages(): void {
    if (!this.currentUser) return;
    this.chatService.getMessages().subscribe({
      next: msgs => {
        this.messages = (msgs || []).map(m => ({
          ...m,
          senderName: m.senderName || 'ناشناس',
          createdAt: new Date(m.createdAt),
          isReadByCurrentUser: m.isReadByCurrentUser ?? false,
          selected: false,
          isHiddenByCurrentUser: m.isHiddenByCurrentUser ?? false
        })).filter(m => !m.isHiddenByCurrentUser)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.updateUnreadCount();
      },
      error: err => console.error('خطا در دریافت پیام‌ها:', err)
    });
  }

  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.currentReceiverIds.length || !this.currentUser) return;

    const dto: CreateChatMessageDto = {
      senderId: this.currentUser.id,
      receiverIds: [...this.currentReceiverIds],
      content: this.newMessageContent,
      conversationId: 0
    };

    this.chatService.sendMessage(dto).subscribe(savedMessage => {
      const messageToAdd: ChatMessage = {
        ...savedMessage,
        senderName: savedMessage.senderName || this.currentUser?.userName || 'ناشناس',
        createdAt: new Date(savedMessage.createdAt),
        selected: false,
        isReadByCurrentUser: true,
        isHiddenByCurrentUser: false
      };
      this.messages = [messageToAdd, ...this.messages];
      this.newMessageContent = '';
      this.currentReceiverIds = [];
      this.updateUnreadCount();
    }, err => console.error('ارسال پیام شکست خورد', err));
  }

  onCheckboxChange(event: Event, userId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      if (!this.currentReceiverIds.includes(userId)) this.currentReceiverIds.push(userId);
    } else {
      this.currentReceiverIds = this.currentReceiverIds.filter(id => id !== userId);
    }
  }

  markAsRead(msg: ChatMessage): void {
    if (!msg.isReadByCurrentUser && msg.receiverIds.includes(this.currentUser!.id)) {
      msg.isReadByCurrentUser = true;
      this.updateUnreadCount();
      this.chatService.markAsRead(msg.id).subscribe({
        error: () => { msg.isReadByCurrentUser = false; this.updateUnreadCount(); }
      });
    }
  }

  hideMessage(msg: ChatMessage): void {
    this.chatService.hideMessage(msg.id).subscribe({
      next: () => {
        msg.isHiddenByCurrentUser = true;
        this.messages = this.messages.filter(m => !m.isHiddenByCurrentUser);
        this.updateUnreadCount();
      },
      error: err => console.error('خطا در مخفی کردن پیام', err)
    });
  }

  deleteSelectedMessages(): void {
    const selected = this.messages.filter(m => m.selected);
    selected.forEach(msg => {
      this.chatService.hideMessage(msg.id).subscribe({
        next: () => {
          msg.isHiddenByCurrentUser = true;
          this.messages = this.messages.filter(m => !m.isHiddenByCurrentUser);
          this.updateUnreadCount();
        },
        error: err => console.error('خطا در حذف پیام', err)
      });
    });
  }

  updateUnreadCount(): void {
    if (!this.currentUser) return;
    this.unreadCount = this.messages.filter(
      m => !m.isReadByCurrentUser && m.receiverIds.includes(this.currentUser!.id)
    ).length;
  }

  get visibleMessages(): ChatMessage[] { return this.messages.filter(m => !m.isHiddenByCurrentUser); }
  get hasSelectedMessages(): boolean { return this.messages.some(m => m.selected); }

  openCreateModal(): void { this.resetForm(); this.showCreateForm = true; }
  openEditModal(referral: UserReferral): void {
    this.isEditMode = true;
    this.editingReferralId = referral.id;

    // تبدیل عددی اگر از API به صورت رشته یا عدد متفاوت آمده
    this.newReferral = {
      ...referral,
      priority: this.toEnumPriority(referral.priority)
    };

    this.showCreateForm = true;
  }

  // متد کمکی برای تبدیل مقدار دریافتی به enum عددی
  private toEnumPriority(value: any): ReferralPriority {
    if (typeof value === 'number') return value; // اگر قبلاً عدد بود
    switch (value) {
      case 'Low':
      case 0:
        return ReferralPriority.Low;
      case 'Medium':
      case 1:
        return ReferralPriority.Medium;
      case 'High':
      case 2:
        return ReferralPriority.High;
      default:
        return ReferralPriority.Medium; // مقدار پیش‌فرض
    }
  }



  saveReferral(): void {
    if (!this.newReferral.assignedToId || !this.currentUser) return;

    this.newReferral.assignedById = this.currentUser.id;

    if (this.isEditMode && this.editingReferralId) {
      // حالت ویرایش
      const payload = {
        ...this.newReferral,
        status: this.newReferral.status ?? ReferralStatus.Pending
      };
      this.referralService.update(this.editingReferralId, payload).subscribe({
        next: () => {
          this.resetForm();
          this.loadReferrals();
        },
        error: () => alert('خطا در بروزرسانی ارجاع')
      });
    } else {
      // حالت ایجاد جدید
      const payload = {
        ...this.newReferral,
        status: this.newReferral.status ?? ReferralStatus.Pending
      };
      this.referralService.create(payload).subscribe({
        next: () => {
          this.resetForm();
          this.loadReferrals();
        },
        error: () => alert('خطا در ایجاد ارجاع')
      });
    }
  }



  updateReferralStatus(referral: UserReferral): void {
    if (!referral.id) return;

    this.referralService.updateStatus(referral.id, referral.status)
      .subscribe({
        next: () => this.loadReferrals(),
        error: err => console.error('خطا در بروزرسانی وضعیت ارجاع:', err)
      });
  }

  markCompleted(referral: UserReferral): void {
    this.referralService.updateStatus(referral.id, ReferralStatus.Completed)
      .subscribe(() => this.loadReferrals());
  }

  deleteReferral(referral: UserReferral): void {
    if (!referral.id || !confirm('آیا مطمئن هستید؟')) return;
    this.referrals = this.referrals.filter(r => r.id !== referral.id);
    this.referralService.delete(referral.id).subscribe();
  }

  resetForm(): void {
    this.newReferral = {
      assignedById: this.currentUser?.id || '',
      assignedToId: '',
      notes: '',
      priority: ReferralPriority.Medium,
      status: ReferralStatus.Pending
    };
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingReferralId = undefined;
  }

  setCurrentUser(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      this.currentUser = {
        id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        userName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        email: '',
        role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      };
      this.newReferral.assignedById = this.currentUser.id;
    } catch { console.error('خطا در decode کردن توکن'); }
  }

  loadReferrals(): void {
    if (!this.currentUser) return;

    this.referralService.getAll().subscribe(data => {
      if (!this.users.length) return;

      const mappedReferrals = (data || []).map(r => ({
        ...r,
        assignedById: r.assignedById?.toString() || '',
        assignedToId: r.assignedToId?.toString() || '',
        assignedByName: this.users.find(u => u.id.toString() === r.assignedById?.toString())?.userName || 'نامشخص',
        assignedToName: this.users.find(u => u.id.toString() === r.assignedToId?.toString())?.userName || 'نامشخص'
      }));

      const currentUserId = this.currentUser!.id?.toString();

      if (this.currentUser!.role === 'Admin') {
        // Admin همه ارجاعات را می‌بیند
        this.referrals = mappedReferrals;
      } else {
        // کاربر معمولی فقط ارجاعاتی که فرستاده یا دریافت کرده را می‌بیند
        this.referrals = mappedReferrals.filter(r =>
          r.assignedById === currentUserId || r.assignedToId === currentUserId
        );
      }
    }, err => console.error('خطا در دریافت ارجاعات:', err));
  }

}
