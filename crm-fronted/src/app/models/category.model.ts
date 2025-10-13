import { Product } from "./product.model";

export interface Category {
  id: string;
  name: string;
  isActive?: boolean;
  products?: Product[];
}
