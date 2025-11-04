import { ProductImage } from "./ProductImage.model";
import { Category } from "./category.model";

export type ProductType = 'Product' | 'Service';

export interface Product {
  id: string;             
  name: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  sku?: string;
  isActive?: boolean;
  type: ProductType;
  categoryId?: string;     
  category?: Category;
  images?: ProductImage[];

  invoiceCount?: number;
}
