// jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwtToken');
  console.log('[jwtInterceptor] token:', token);

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[jwtInterceptor] request sent with Authorization header');
    return next(cloned);
  }

  console.log('[jwtInterceptor] request sent WITHOUT Authorization header');
  return next(req);
};
