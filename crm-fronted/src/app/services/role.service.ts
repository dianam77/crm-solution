import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from '../models/role.model';
import { Permission, GroupedPermission } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private api = 'https://localhost:44386/api/roles';

  constructor(private http: HttpClient) { }

  getRoles() {
    return this.http.get<Role[]>(this.api);
  }

  getPermissions() {
    return this.http.get<Permission[]>(`${this.api}/permissions`);
  }

  getGroupedPermissions() {
    return this.http.get<GroupedPermission[]>(`${this.api}/permissions/grouped`);
  }

  createRole(roleName: string, permissionIds: string[]) {
    return this.http.post(this.api, { name: roleName, permissionIds });
  }

  updateRolePermissions(roleId: string, permissionIds: string[]) {
    return this.http.put(`${this.api}/${roleId}`, { permissionIds });
  }

  deleteRole(roleId: string) {
    return this.http.delete(`${this.api}/${roleId}`);
  }
}
