import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-product-availability',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './product-availability.component.html',
  styleUrls: ['./product-availability.component.css']
})
export class ProductAvailabilityComponent implements OnInit {
  loading = true;
  chartType: 'pie' = 'pie';
  productData!: ChartData<'pie', number[], string>;

  options: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (tooltipItem) => {
            const index = tooltipItem.dataIndex;
            const dataset = this.productData.datasets?.[0];
            const data = dataset?.data ?? [0, 0];
            const value = data[index] ?? 0;
            const total = data.reduce((sum, v) => sum + v, 1);
            const label = this.productData.labels?.[index] ?? '';
            const percent = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} مورد (${percent}%)`;
          }
        }
      }
    }
  };

  constructor() { }

  ngOnInit(): void {
    // استفاده از داده ثابت برای اطمینان از رندر
    const productCount = 3; // تعداد محصولات واقعی
    const serviceCount = 1; // تعداد خدمات واقعی

    setTimeout(() => {
      this.productData = {
        labels: ['محصول', 'خدمت'],
        datasets: [
          {
            data: [productCount, serviceCount],
            backgroundColor: ['#4f91ff', '#28c76f'],
            hoverOffset: 10
          }
        ]
      };
      this.loading = false;
    }, 0);
  }
}
