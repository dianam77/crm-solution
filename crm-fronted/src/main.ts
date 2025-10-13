// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, enableProdMode } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations'; // ← اضافه شد

import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { jwtInterceptor } from './app/jwt.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    importProvidersFrom(FormsModule, ReactiveFormsModule),
    provideAnimations() // ← این را اضافه کنید
  ]
}).catch(err => console.error(err));

