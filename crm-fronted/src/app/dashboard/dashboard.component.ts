import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ActiveCustomersComponent } from './active-customers/active-customers.component';
import { ProductAvailabilityComponent } from './product-availability-chart/product-availability.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    
    NavbarComponent,
    ActiveCustomersComponent,
    ProductAvailabilityComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username = '';

  ngOnInit(): void {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.username = decoded.sub || '';
    }
  }
}
