import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerIndividualService } from '../../services/customer-individual.service';
import { CustomerCompanyService } from '../../services/customer-company.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-active-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-customers.component.html',
  styleUrls: ['./active-customers.component.css']
})
export class ActiveCustomersComponent implements OnInit {
  individualCount = 0;
  companyCount = 0;
  loading = true;

  constructor(
    private individualService: CustomerIndividualService,
    private companyService: CustomerCompanyService
  ) { }

  ngOnInit(): void {
    this.loadCounts();
  }

  loadCounts() {
    this.loading = true;

    forkJoin([
      this.individualService.getAll(),
      this.companyService.getAll()
    ]).subscribe({
      next: ([individuals, companies]) => {
        this.individualCount = individuals.length;
        this.companyCount = companies.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('خطا در بارگذاری مشتریان:', err);
        this.loading = false;
      }
    });
  }
}
