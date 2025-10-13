import { ProductImage } from "./ProductImage.model";
import { Category } from "./category.model";

// نوع محصول/خدمت
export type ProductType = 'Product' | 'Service';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;             // nullable، اختیاری
  stockQuantity?: number;
  sku?: string;
  isActive?: boolean;
  type: ProductType;          // نوع محصول یا خدمت
  categoryId?: string;
  category?: Category;
  images?: ProductImage[];    // چند تصویر
}
