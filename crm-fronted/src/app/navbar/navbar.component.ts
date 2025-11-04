
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
import moment from 'moment-jalaali';

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

  messages: ChatMessage[] = [];
  unreadCount = 0;
  newMessageContent = '';
  currentReceiverIds: string[] = [];
  currentUserPermissions: string[] = []; 
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
    moment.loadPersian({ usePersianDigits: true });
    this.setCurrentUser();
    this.loadUserPermissions(); 
    this.loadUsers();
  }
  toJalali(date: any): string {
    if (!date) return '-';
    const m = moment(date);
    return m.isValid() ? m.format('HH:mm jYYYY/jMM/jDD') : '-';
  }


  private loadUsers(): void {
    const loader = this.currentUser?.role === 'User'
      ? this.userService.getUserNames()
      : this.userService.getUsers();

    loader.subscribe(
      users => {
 
        this.users = users.map(u => ({
          ...u,
          id: u.id.toString(),
          role: u.role || ''
        }));

    
        if (this.currentUser) {
          const matchedUser = this.users.find(u => u.id === this.currentUser!.id);
          if (matchedUser) {
            this.currentUser.email = matchedUser.email;
          }
        }

        this.loadMessages();
        this.loadReferrals();
      },
      error => console.error('خطا در دریافت کاربران:', error)
    );
  }
  startPasswordEdit() {
    this.passwordEditMode = true;
    this.newPassword = '';
    this.passwordVisible = false;
  }

  cancelPasswordEdit() {
    this.passwordEditMode = false;
    this.newPassword = '';
  }

  isPasswordValid(): boolean {
    return !!this.newPassword && /[A-Z]/.test(this.newPassword) && /[a-z]/.test(this.newPassword);
  }


  submitPasswordChange() {
    if (!this.currentUser) return;

    if (!this.isPasswordValid()) {
      alert('رمز عبور باید حداقل یک حرف بزرگ و یک حرف کوچک داشته باشد.');
      return;
    }

    const updatedUser = {
      id: this.currentUser.id,
      userName: this.currentUser.userName,
      email: this.currentUser.email,
      role: this.currentUser.role,
      password: this.newPassword
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        alert('رمز عبور با موفقیت تغییر کرد.');
        this.cancelPasswordEdit();
      },
      error: err => {
        console.error('خطا در تغییر رمز عبور:', err);
        alert('خطا در به‌روزرسانی رمز عبور');
      }
    });
  }

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
      this.newReferral.assignedById = this.currentUser.id;
    } catch {
      console.error('خطا در decode کردن توکن');
    }
  }

 
  editMode = false;
  editableUserName = '';
  editableEmail = '';

  
  startEdit(): void {
    this.editMode = true;
    this.editableUserName = this.currentUser?.userName || '';
    this.editableEmail = this.currentUser?.email || '';
  }

  
  cancelEdit(): void {
    this.editMode = false;
  }


  saveProfileChanges(): void {
    if (!this.currentUser) return;

    const updatedUser = {
      ...this.currentUser,
      userName: this.editableUserName.trim(),
      email: this.editableEmail.trim()
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        alert('اطلاعات شما با موفقیت به‌روزرسانی شد.');
        this.currentUser = updatedUser;
        this.editMode = false;
      },
      error: err => {
        console.error('خطا در به‌روزرسانی اطلاعات:', err);
        alert('خطا در به‌روزرسانی اطلاعات');
      }
    });
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


    let messages$;
    if (this.hasPermission('chatmessages.getall')) {
      messages$ = this.chatService.getMessages(); 
    } else if (this.hasPermission('chatmessages.getmy')) {
      messages$ = this.chatService.getMyMessages(); 
    } else {
      this.messages = []; 
      this.updateUnreadCount();
      return;
    }

    messages$.subscribe({
      next: msgs => {
        this.messages = (msgs || []).map(m => ({
          ...m,
          senderName: m.senderName || 'ناشناس',
          createdAt: new Date(m.createdAt),
          isReadByCurrentUser: m.isReadByCurrentUser ?? false,
          selected: false,
          isHiddenByCurrentUser: m.isHiddenByCurrentUser ?? false
        }))
          .filter(m => !m.isHiddenByCurrentUser)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        this.updateUnreadCount();
      },
      error: err => console.error('خطا در دریافت پیام‌ها:', err)
    });
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
 
  toggleFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
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


    this.newReferral = {
      ...referral,
      priority: this.toEnumPriority(referral.priority)
    };

    this.showCreateForm = true;
  }

  private toEnumPriority(value: any): ReferralPriority {
    if (typeof value === 'number') return value; 
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
        return ReferralPriority.Medium; 
    }
  }



  saveReferral(): void {
    if (!this.newReferral.assignedToId || !this.currentUser) return;

    this.newReferral.assignedById = this.currentUser.id;

    if (this.isEditMode && this.editingReferralId) {
      
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

 

  loadReferrals(): void {
    if (!this.currentUser) return;

    let request$;

    if (this.authService.hasPermission('UserReferral.GetAll')) {
      request$ = this.referralService.getAllReferrals();
    } else if (this.authService.hasPermission('UserReferral.GetMyReferrals')) {
      request$ = this.referralService.getMyReferrals();
    } else {
      console.error('کاربر دسترسی مشاهده ارجاعات را ندارد');
      return;
    }

    request$.subscribe({
      next: data => {
        if (!this.users.length) return;

        this.referrals = (data || []).map(r => ({
          ...r,
          assignedById: r.assignedById?.toString() || '',
          assignedToId: r.assignedToId?.toString() || '',
          assignedByName: this.users.find(u => u.id.toString() === r.assignedById?.toString())?.userName || 'نامشخص',
          assignedToName: this.users.find(u => u.id.toString() === r.assignedToId?.toString())?.userName || 'نامشخص'
        }));
      },
      error: err => console.error('خطا در دریافت ارجاعات:', err)
    });
  }


  profileDropdownOpen = false;

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }


}
