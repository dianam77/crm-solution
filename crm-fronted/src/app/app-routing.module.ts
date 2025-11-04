import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { PermissionGuard } from './guards/permission.guard';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },

 
  {
    path: '',
    component: MainLayoutComponent,
    children: [
   
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'register',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'users/manage',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./user-management/user-management.component').then(
            m => m.UserManagementComponent
          ),
      },
      {
        path: 'customer-individual',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./customer-individual-list/customer-individual-list.component').then(
            m => m.CustomerIndividualListComponent
          ),
      },
      {
        path: 'customer-company',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./customer-company-list/customer-company-list.component').then(
            m => m.CustomerCompanyListComponent
          ),
      },
      {
        path: 'customer-interaction',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./customer-interaction/customer-interaction.component').then(
            m => m.CustomerInteractionComponent
          ),
      },
      {
        path: 'products/manage',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./product-management/product-management.component').then(
            m => m.ProductManagementComponent
          ),
      },
      {
        path: 'categories/manage',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./category-management/category-management.component').then(
            m => m.CategoryManagementComponent
          ),
      },
      {
        path: 'invoices',
        canActivate: [PermissionGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./invoice-list/invoice-list.component').then(m => m.InvoiceListComponent),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
          },
        ],
      },
      {
        path: 'roles/manage',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./role-management/role-management.component').then(
            m => m.RoleManagementComponent
          ),
      },
      {
        path: 'main-company',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./main-company/main-company.component').then(m => m.MainCompanyComponent),
      },
      {
        path: 'smtp-settings',
        canActivate: [PermissionGuard],
        loadComponent: () =>
          import('./smtp-settings/smtp-settings.component').then(
            m => m.SmtpSettingsComponent
          ),
      }

    ],
  },

  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
