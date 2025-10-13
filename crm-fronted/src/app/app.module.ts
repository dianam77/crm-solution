import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { routes } from './app-routing.module';

import { NgPersianDatepickerModule } from 'ng-persian-datepicker';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

import { CustomerInteractionComponent } from './customer-interaction/customer-interaction.component';
import { CustomerIndividualListComponent } from './customer-individual-list/customer-individual-list.component';
import { CustomerIndividualFormComponent } from './customer-individual-list/customer-individual-form/customer-individual-form.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainLayoutComponent,
    CustomerInteractionComponent,
    CustomerIndividualListComponent,
    CustomerIndividualFormComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    OverlayModule,
    PortalModule,
    NgPersianDatepickerModule,
    NgxMaterialTimepickerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
