export interface User {
  id: string;
  userName: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;

  // 🟢 فیلد محاسبه شده برای نمایش نام کامل
  fullName?: string;
}


export interface UserEdit {
  id: string;
  userName: string;
  email: string;
  role?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterUser {
  userName: string;
  email: string;
  password: string;
  roleName: string;
  firstName?: string;
  lastName?: string;
}
