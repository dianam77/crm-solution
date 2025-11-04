import { City } from './City.model';

export interface Province {
  provinceId: number;
  name: string;      
  cities: City[];    
}
