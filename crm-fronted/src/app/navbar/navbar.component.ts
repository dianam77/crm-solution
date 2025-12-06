import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import jwtDecode from 'jwt-decode';
import moment from 'moment-jalaali';
import 'moment-timezone';

import { UserService } from '../services/user.service';
import { ChatService } from '../services/ChatService';
import { AuthService } from '../services/auth.service';
import { CustomerInteractionReferralService } from '../services/customer-interaction-referral.service';

import { User } from '../models/user.model';
import { ChatMessage, CreateChatMessageDto } from '../models/ChatMessage';
import { Router } from '@angular/router';
import { CustomerInteractionReferral } from '../models/customer-interaction-referral.model';
import { InteractionType } from '../models/customer-interaction.model';

export const InteractionTypeLabels: Record<number, string> = {
  [InteractionType.Call]: 'تماس',
  [InteractionType.Meeting]: 'جلسه',
  [InteractionType.Email]: 'ایمیل',
  [InteractionType.SMS]: 'پیامک',
  [InteractionType.Note]: 'یادداشت',
  [InteractionType.Other]: 'سایر'
};

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
  passwordEditMode = false;
  passwordVisible = false;
  newPassword = '';
  referralCount = 0;
  messages: ChatMessage[] = [];
  unreadCount = 0;
  newMessageContent = '';
  currentReceiverIds: string[] = [];
  currentUserPermissions: string[] = [];

  editMode = false;
  editableFirstName = '';
  editableLastName = '';
  editableUserName = '';
  editableEmail = '';
  InteractionTypeLabels = InteractionTypeLabels;
  unreadReferralsCount = 0;

  profileDropdownOpen = false;
  referrals: CustomerInteractionReferral[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    private customerReferralService: CustomerInteractionReferralService,
  ) { }

  ngOnInit(): void {
    moment.loadPersian({ usePersianDigits: true });
    this.setCurrentUser();
    this.loadUserPermissions();
    this.loadUsers();
    this.loadCurrentUserProfile();
  }

  // ======================== Date Utilities ========================
  toJalali(date: any): string {
    if (!date) return '-';
    const m = moment(date).tz('Asia/Tehran'); // 🚀 استفاده از moment-timezone
    return m.isValid() ? m.format('HH:mm jYYYY/jMM/jDD') : '-';
  }

  // ======================== User Setup ===========================
  setCurrentUser(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      this.currentUser = {
        id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        userName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        email: '',
        role: Array.isArray(userRole) ? userRole[0] : userRole
      };
    } catch {
      console.error('خطا در decode کردن توکن');
    }
  }

  private loadUserPermissions(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      this.currentUserPermissions = decoded['permissions'] || [];
    } catch {
      console.error('خطا در decode کردن توکن برای پرمیژن‌ها');
    }
  }

  hasPermission(permission: string): boolean {
    return this.currentUserPermissions.includes(permission);
  }

  // ======================== User Profile =========================
  loadCurrentUserProfile(): void {
    this.userService.getCurrentUser().subscribe({
      next: user => {
        if (!this.currentUser) return;
        this.currentUser.firstName = user.firstName;
        this.currentUser.lastName = user.lastName;
        this.currentUser.email = user.email;
        this.currentUser.role = user.role;
      },
      error: err => console.error("خطا در دریافت پروفایل:", err)
    });
  }

  startEdit(): void {
    this.editMode = true;
    this.passwordEditMode = false;
    this.editableFirstName = this.currentUser?.firstName || '';
    this.editableLastName = this.currentUser?.lastName || '';
    this.editableUserName = this.currentUser?.userName || '';
    this.editableEmail = this.currentUser?.email || '';
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  saveProfileChanges(): void {
    if (!this.currentUser) return;
    const updatedUser = {
      id: this.currentUser.id,
      firstName: this.editableFirstName.trim(),
      lastName: this.editableLastName.trim(),
      userName: this.editableUserName.trim(),
      email: this.editableEmail.trim(),
      role: this.currentUser.role,
      password: ""
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        alert('اطلاعات شما با موفقیت به‌روزرسانی شد.');
        this.editMode = false;
        this.userService.getCurrentUser().subscribe(profile => {
          if (!profile) return;
          this.currentUser = {
            ...this.currentUser!,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            role: profile.role,
            userName: profile.userName
          };
        });
      },
      error: err => {
        console.error('خطا در به‌روزرسانی اطلاعات:', err);
        alert('خطا در به‌روزرسانی اطلاعات');
      }
    });
  }

  // ======================== Password =============================
  startPasswordEdit() { this.passwordEditMode = true; this.newPassword = ''; this.passwordVisible = false; }
  cancelPasswordEdit() { this.passwordEditMode = false; this.newPassword = ''; }
  isPasswordValid(): boolean { return !!this.newPassword && /[A-Z]/.test(this.newPassword) && /[a-z]/.test(this.newPassword); }

  submitPasswordChange() {
    if (!this.currentUser) return;
    if (!this.isPasswordValid()) { alert('رمز عبور باید حداقل یک حرف بزرگ و یک حرف کوچک داشته باشد.'); return; }

    const model = { id: this.currentUser.id, newPassword: this.newPassword };
    this.userService.changePassword(model).subscribe({
      next: () => { alert("رمز عبور با موفقیت تغییر کرد."); this.cancelPasswordEdit(); },
      error: err => { console.error("خطا در تغییر رمز عبور:", err); alert("خطا در تغییر رمز عبور"); }
    });
  }

  // ======================== Navbar Toggles ======================
  toggleNavbar(): void { this.navbarCollapsed = !this.navbarCollapsed; }
  toggleSearch(): void { this.searchVisible = !this.searchVisible; }
  toggleTheme(): void { this.darkMode = !this.darkMode; }
  toggleReferralPanel(): void { this.referralPanelVisible = !this.referralPanelVisible; if (this.referralPanelVisible) this.loadReferrals(); }
  toggleReceiverList(): void { this.receiversOpen = !this.receiversOpen; }
  toggleMessages(): void { this.messagesOpen = !this.messagesOpen; }
  toggleProfileDropdown(): void { this.profileDropdownOpen = !this.profileDropdownOpen; }

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
  toggleFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) { elem.requestFullscreen(); } else { document.exitFullscreen(); }
  }

  // ======================== Messages ============================
  loadMessages(): void {
    if (!this.currentUser) return;

    let messages$;
    if (this.hasPermission('chatmessages.getall')) messages$ = this.chatService.getMessages();
    else if (this.hasPermission('chatmessages.getmy')) messages$ = this.chatService.getMyMessages();
    else { this.messages = []; this.updateUnreadCount(); return; }

    messages$.subscribe({
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
    const dto: CreateChatMessageDto = { senderId: this.currentUser.id, receiverIds: [...this.currentReceiverIds], content: this.newMessageContent, conversationId: 0 };
    this.chatService.sendMessage(dto).subscribe(savedMessage => {
      const messageToAdd: ChatMessage = { ...savedMessage, senderName: savedMessage.senderName || this.currentUser?.userName || 'ناشناس', createdAt: new Date(savedMessage.createdAt), selected: false, isReadByCurrentUser: true, isHiddenByCurrentUser: false };
      this.messages = [messageToAdd, ...this.messages];
      this.newMessageContent = '';
      this.currentReceiverIds = [];
      this.updateUnreadCount();
    }, err => console.error('ارسال پیام شکست خورد', err));
  }

  onCheckboxChange(event: Event, userId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) { if (!this.currentReceiverIds.includes(userId)) this.currentReceiverIds.push(userId); }
    else { this.currentReceiverIds = this.currentReceiverIds.filter(id => id !== userId); }
  }

  markAsRead(msg: ChatMessage): void {
    if (!msg.isReadByCurrentUser && msg.receiverIds.includes(this.currentUser!.id)) {
      msg.isReadByCurrentUser = true;
      this.updateUnreadCount();
      this.chatService.markAsRead(msg.id).subscribe({ error: () => { msg.isReadByCurrentUser = false; this.updateUnreadCount(); } });
    }
  }

  hideMessage(msg: ChatMessage): void {
    this.chatService.hideMessage(msg.id).subscribe({
      next: () => { msg.isHiddenByCurrentUser = true; this.messages = this.messages.filter(m => !m.isHiddenByCurrentUser); this.updateUnreadCount(); },
      error: err => console.error('خطا در مخفی کردن پیام', err)
    });
  }

  deleteSelectedMessages(): void {
    const selected = this.messages.filter(m => m.selected);
    selected.forEach(msg => {
      this.chatService.hideMessage(msg.id).subscribe({
        next: () => { msg.isHiddenByCurrentUser = true; this.messages = this.messages.filter(m => !m.isHiddenByCurrentUser); this.updateUnreadCount(); },
        error: err => console.error('خطا در حذف پیام', err)
      });
    });
  }

  updateUnreadCount(): void {
    if (!this.currentUser) return;
    this.unreadCount = this.messages.filter(m => !m.isReadByCurrentUser && m.receiverIds.includes(this.currentUser!.id)).length;
  }

  get visibleMessages(): ChatMessage[] { return this.messages.filter(m => !m.isHiddenByCurrentUser); }
  get hasSelectedMessages(): boolean { return this.messages.some(m => m.selected); }

  // ======================== Referrals ===========================
  loadUserReferrals(): void {
    if (!this.currentUser) return;
    this.customerReferralService.getReferralsByUser(this.currentUser.id)
      .subscribe({
        next: (referrals: CustomerInteractionReferral[]) => {
          this.referrals = referrals.map(r => ({ ...r, referredAt: r.referredAt ? new Date(r.referredAt).toISOString() : undefined }));
          this.updateUnreadReferralsCount();
        },
        error: err => console.error('خطا در دریافت ارجاعات:', err)
      });
  }

  loadReferrals(): void { this.loadUserReferrals(); }

  markReferralAsRead(referral: CustomerInteractionReferral): void {
    if (referral.isRead) return;
    this.customerReferralService.markAsRead(referral.id).subscribe({
      next: () => { referral.isRead = true; this.updateUnreadReferralsCount(); },
      error: err => console.error('خطا در علامت‌گذاری ارجاع به عنوان خوانده', err)
    });
  }

  updateUnreadReferralsCount(): void { this.unreadReferralsCount = this.referrals.filter(r => !r.isRead).length; }

  private loadUsers(): void {
    const loader = this.currentUser?.role === 'User' ? this.userService.getUserNames() : this.userService.getUsers();
    loader.subscribe({
      next: users => {
        this.users = users.map(u => ({ ...u, id: u.id.toString(), role: u.role || '' }));
        if (this.currentUser) {
          const matchedUser = this.users.find(u => u.id === this.currentUser!.id);
          if (matchedUser) this.currentUser.email = matchedUser.email;
        }
        this.loadMessages();
        this.loadReferrals();
      },
      error: err => console.error('خطا در دریافت کاربران:', err)
    });
  }
}
