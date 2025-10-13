import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { AdminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'register',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'users/manage',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./user-management/user-management.component').then(m => m.UserManagementComponent),
      },
      {
        path: 'customer-individual',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./customer-individual-list/customer-individual-list.component').then(
            m => m.CustomerIndividualListComponent
          ),
      },
      {
        path: 'customer-company',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./customer-company-list/customer-company-list.component').then(
            m => m.CustomerCompanyListComponent
          ),
      },
      {
        path: 'customer-interaction',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./customer-interaction/customer-interaction.component').then(
            m => m.CustomerInteractionComponent
          ),
      },
      // ---------- مدیریت محصولات و دسته‌بندی‌ها ----------
      {
        path: 'products/manage',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./product-management/product-management.component').then(
            m => m.ProductManagementComponent
          ),
      },
      {
        path: 'categories/manage',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./category-management/category-management.component').then(
            m => m.CategoryManagementComponent
          ),
      },
      // ---------- فاکتورها و پیش‌فاکتورها ----------
      {
        path: 'invoices',
        canActivate: [AdminGuard],
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
          }
        ]
      }
      ,
      {
        path: 'main-company',
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./main-company/main-company.component').then(m => m.MainCompanyComponent),
      },



    ],
  },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
