import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, ArcElement, Tooltip, Legend } from 'chart.js';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

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
  showEmptyMessage = false;

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
            const data = dataset?.data ?? [];
            const value = data[index] ?? 0;
            const total = data.reduce((sum, v) => sum + v, 0);
            const label = this.productData.labels?.[index] ?? '';
            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} مورد (${percent}%)`;
          }
        }
      }
    }
  };

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(
      (products: Product[]) => {
        let productCount = products.filter(p => p.type === 'Product').length;
        let serviceCount = products.filter(p => p.type === 'Service').length;

        if (productCount + serviceCount === 0) {
          productCount = 0;
          serviceCount = 0;
          this.showEmptyMessage = true;
        } else {
          this.showEmptyMessage = false;
        }

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
      },
      err => {
        console.error('خطا در دریافت محصولات:', err);
        this.productData = {
          labels: ['محصول', 'خدمت'],
          datasets: [
            { data: [0, 0], backgroundColor: ['#4f91ff', '#28c76f'], hoverOffset: 10 }
          ]
        };
        this.showEmptyMessage = true;
        this.loading = false;
      }
    );
  }
}
