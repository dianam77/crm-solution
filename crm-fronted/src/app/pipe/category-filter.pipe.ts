import { Pipe, PipeTransform } from '@angular/core';
import { Product } from '../models/product.model';

@Pipe({
  name: 'categoryFilter'
})
export class CategoryFilterPipe implements PipeTransform {
  transform(products: Product[], categoryId?: string | null): Product[] {
    if (!categoryId) return products;
    return products.filter(p => p.categoryId === categoryId);
  }
}
