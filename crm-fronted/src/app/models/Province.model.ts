import { City } from './City.model';

export interface Province {
  provinceId: number;
  name: string;       // نام استان (مطابق JSON واقعی)
  cities: City[];     // شهرهای وابسته به این استان
}
