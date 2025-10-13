import { Permission } from './permission.model';

export interface Role {
  id: string;
  name: string;
  description?: string; // اختیاری
  permissions: Permission[];
}
