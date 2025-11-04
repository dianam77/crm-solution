import { Component, OnInit } from '@angular/core';
import { Role } from '../models/role.model';
import { GroupedPermission, DisplayPermission } from '../models/permission.model';
import { RoleService } from '../services/role.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.css'],
  imports: [ReactiveFormsModule, FormsModule, CommonModule]
})
export class RoleManagementComponent implements OnInit {

  roles: (Role & { permissions: DisplayPermission[] })[] = [];
  groupedPermissions: (GroupedPermission & { actions: DisplayPermission[]; expanded?: boolean })[] = [];
  selectedPermissions: Set<string> = new Set();
  newRoleName = '';
  selectedRoleId: string | null = null;
  showModal = false;
  showOperationsColumn = false;
  currentUserRole: any;

  permissionTranslations: { [key: string]: string } = {
    // --- Categories ---
    'Categories.GetCategories': 'مشاهده لیست دسته‌بندی‌ها',
    'Categories.GetCategory': 'مشاهده جزئیات دسته‌بندی',
    'Categories.CreateCategory': 'ایجاد دسته‌بندی جدید',
    'Categories.UpdateCategory': 'ویرایش دسته‌بندی',
    'Categories.DeleteCategory': 'حذف دسته‌بندی',

    // --- ChatMessages ---
    'ChatMessages.GetMyMessages': 'مشاهده پیام‌های من',
    'ChatMessages.GetUnreadMessagesCount': 'مشاهده تعداد پیام‌های خوانده‌نشده',
    'ChatMessages.GetMessages': 'مشاهده لیست پیام‌ها',
    'ChatMessages.HideMessage': 'مخفی کردن پیام',
    'ChatMessages.SendMessage': 'ارسال پیام',
    'ChatMessages.MarkAsRead': 'علامت‌گذاری پیام به عنوان خوانده‌شده',

    // --- CustomerCompanyApi ---
    'CustomerCompanyApi.GetCompanies': 'مشاهده لیست مشتریان حقوقی',
    'CustomerCompanyApi.GetCompany': 'مشاهده جزئیات مشتری حقوقی',
    'CustomerCompanyApi.CreateCompany': 'ایجاد مشتری حقوقی',
    'CustomerCompanyApi.UpdateCompany': 'ویرایش مشتری حقوقی',
    'CustomerCompanyApi.DeleteCompany': 'حذف مشتری حقوقی',

    // --- CustomerIndividualApi ---
    'CustomerIndividualApi.GetAll': 'مشاهده لیست مشتریان حقیقی',
    'CustomerIndividualApi.Get': 'مشاهده جزئیات مشتری حقیقی',
    'CustomerIndividualApi.Create': 'ایجاد مشتری حقیقی',
    'CustomerIndividualApi.Edit': 'ویرایش مشتری حقیقی',
    'CustomerIndividualApi.Delete': 'حذف مشتری حقیقی',

    // --- CustomerInteraction ---
    'CustomerInteraction.GetAll': 'مشاهده لیست تعاملات مشتری',
    'CustomerInteraction.GetById': 'مشاهده جزئیات تعامل',
    'CustomerInteraction.Create': 'ایجاد تعامل جدید',
    'CustomerInteraction.Update': 'ویرایش تعامل',
    'CustomerInteraction.Delete': 'حذف تعامل',
    'CustomerInteraction.GetCategoriesWithProducts': '  مشاهده دسته‌بندی‌ها و محصولات',

    // --- Home ---
    'Home.Dashboard': 'دسترسی به داشبورد',
    'Home.Register': 'ثبت‌نام کاربر',

    // --- Invoice ---
    'Invoice.GetAll': 'مشاهده لیست فاکتورها',
    'Invoice.GetById': 'مشاهده جزئیات فاکتور',
    'Invoice.Create': 'ایجاد فاکتور جدید',
    'Invoice.Update': 'ویرایش فاکتور',
    'Invoice.Delete': 'حذف فاکتور',

    // --- MainCompany ---
    'MainCompany.GetAll': 'مشاهده لیست شرکت‌ها',
    'MainCompany.GetById': 'مشاهده جزئیات شرکت',
    'MainCompany.Create': 'ایجاد شرکت جدید',
    'MainCompany.Update': 'ویرایش شرکت',
    'MainCompany.Delete': 'حذف شرکت',

    // --- Products ---
    'Products.GetProducts': 'مشاهده لیست محصولات',
    'Products.GetProduct': 'مشاهده جزئیات محصول',
    'Products.CreateProduct': 'ایجاد محصول جدید',
    'Products.UpdateProduct': 'ویرایش محصول',
    'Products.DeleteProduct': 'حذف محصول',

    // --- UserReferral ---
    'UserReferral.GetMyReferrals': 'مشاهده ارجاعات شخصی',
    'UserReferral.GetAll': 'مشاهده لیست ارجاعات',
    'UserReferral.GetById': 'مشاهده جزئیات ارجاع',
    'UserReferral.Create': 'ایجاد ارجاع جدید',
    'UserReferral.Update': 'ویرایش ارجاع',
    'UserReferral.UpdateStatus': 'ویرایش وضعیت ارجاع',
    'UserReferral.Delete': 'حذف ارجاع',

    // --- Users ---
    'Users.GetUsers': 'مشاهده لیست کاربران',
    'Users.GetUserNames': 'مشاهده نام کاربران',
    'Users.EditUser': 'ویرایش اطلاعات کاربر',
    'Users.DeleteUser': 'حذف کاربر',
    'Users.GetRoles': 'مشاهده لیست نقش‌ها',

    // --- SMTP Settings ---
    'SmtpSettings.GetAll': 'مشاهده لیست تنظیمات SMTP',
    'SmtpSettings.GetById': 'مشاهده جزئیات تنظیم SMTP',
    'SmtpSettings.Create': 'ایجاد تنظیم SMTP جدید',
    'SmtpSettings.Update': 'ویرایش تنظیمات SMTP',
    'SmtpSettings.Delete': 'حذف تنظیم SMTP',
    'SmtpSettings.Get': 'مشاهده تنظیمات SMTP',

  };


  controllerTranslations: { [key: string]: string } = {
    'Categories': 'دسته‌بندی‌ها',
    'ChatMessages': 'پیام‌ها',
    'CustomerCompanyApi': 'مشتریان حقوقی',
    'CustomerIndividualApi': 'مشتریان حقیقی',
    'CustomerInteraction': 'تعاملات مشتری',
    'Home': 'خانه',
    'Invoice': 'فاکتورها',
    'MainCompany': 'شرکت‌ها',
    'Products': 'محصولات',
    'UserReferral': 'ارجاعات کاربری',
    'Users': 'کاربران',
    'SmtpSettings': 'تنظیمات SMTP'
  };

  constructor(private roleService: RoleService) { }

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();
    this.setCurrentUserRole();
  }

  private mapPermissions(perms: any[]): DisplayPermission[] {
    return perms.map(p => ({
      id: p.id,
      name: p.name,
      displayName: this.permissionTranslations[p.name] || p.name
    }));
  }

  setCurrentUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      this.currentUserRole = Array.isArray(roles) ? roles[0] : roles;
    } catch (err) {
      console.error('Invalid token', err);
    }
  }

  isAdmin(): boolean {
    return this.currentUserRole?.toLowerCase() === 'admin';
  }

  loadPermissions() {
    this.roleService.getGroupedPermissions().subscribe(data => {
      this.groupedPermissions = data.map(group => ({
        ...group,
        actions: this.mapPermissions(group.actions || []),
        expanded: false 
      }));
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(data => {
      this.roles = data.map(role => ({
        ...role,
        permissions: this.mapPermissions(role.permissions)
      }));
      this.showOperationsColumn = this.roles.some(role => this.isAdmin() && !this.isAdminRole(role.id));
    });
  }


  toggleSelectAll(group: any, checked: boolean) {
    if (checked) {
      group.actions.forEach((perm: any) => this.selectedPermissions.add(perm.id));
    } else {
      group.actions.forEach((perm: any) => this.selectedPermissions.delete(perm.id));
    }
  }

  isAllSelected(group: any): boolean {
    return group.actions.every((perm: any) => this.selectedPermissions.has(perm.id));
  }

  toggleSelectAllGlobal(checked: boolean) {
    this.groupedPermissions.forEach(group =>
      group.actions.forEach((perm: any) =>
        checked ? this.selectedPermissions.add(perm.id) : this.selectedPermissions.delete(perm.id)
      )
    );
  }

  isAllPermissionsSelected(): boolean {
    return this.groupedPermissions.every(group =>
      group.actions.every((perm: any) => this.selectedPermissions.has(perm.id))
    );
  }


  toggleGroupExpand(group: any) {
    group.expanded = !group.expanded;
  }

  openModal(role?: Role) {
    this.showModal = true;
    if (role) {
      this.selectedRoleId = role.id;
      this.newRoleName = role.name;
      this.selectedPermissions = new Set(role.permissions.map(p => p.id));
    } else {
      this.selectedRoleId = null;
      this.newRoleName = '';
      this.selectedPermissions.clear();
    }
  }

  closeModal() { this.showModal = false; }


  onPermissionToggle(permissionId: string) {
    this.selectedPermissions.has(permissionId)
      ? this.selectedPermissions.delete(permissionId)
      : this.selectedPermissions.add(permissionId);
  }

  saveRole() {
    const ids = Array.from(this.selectedPermissions);

    if (!this.newRoleName.trim()) {
      alert('لطفاً نام نقش را وارد کنید ⚠️');
      return;
    }
    if (ids.length === 0) {
      alert('حداقل یک دسترسی باید انتخاب شود ⚠️');
      return;
    }

    if (this.selectedRoleId) {
      this.roleService.updateRolePermissions(this.selectedRoleId, ids).subscribe(() => {
        alert('تغییرات نقش ذخیره شد ✅');
        this.loadRoles();
        this.closeModal();
      });
    } else {
      this.roleService.createRole(this.newRoleName, ids).subscribe(() => {
        alert('نقش جدید ایجاد شد ✅');
        this.loadRoles();
        this.closeModal();
      });
    }
  }

  deleteRole(id: string) {
    if (!confirm('آیا از حذف این نقش مطمئن هستید؟')) return;
    this.roleService.deleteRole(id).subscribe(() => {
      alert('نقش حذف شد ❌');
      this.loadRoles();
    });
  }

  isAdminRole(roleId: string): boolean {
    const role = this.roles.find(r => r.id === roleId);
    return role?.name.toLowerCase() === 'admin';
  }

  isEditingAdmin(): boolean {
    return !!(this.selectedRoleId && this.isAdminRole(this.selectedRoleId));
  }
}
