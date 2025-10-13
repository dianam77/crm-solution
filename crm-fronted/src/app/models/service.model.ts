export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  productId?: string; // مرتبط با محصول (اختیاری)
}
