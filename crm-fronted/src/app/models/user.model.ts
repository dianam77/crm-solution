export interface User {
  id: string;
  userName: string;
  email: string;
  role?: string;
}

export interface UserEdit {
  id: string;
  userName: string;
  email: string;
  role?: string;
  password?: string;
}
