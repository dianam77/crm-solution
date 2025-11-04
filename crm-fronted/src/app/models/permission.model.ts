export interface Permission {
  id: string;
  name: string;
  description?: string; 
}
export interface GroupedPermission {
  controller: string;
  actions: Permission[];
}


export interface DisplayPermission {
  id: string;
  name: string;
  displayName: string; 
  }
