import { Injectable, inject } from '@angular/core';
import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../pages/authentication/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authToken = this.authService.getToken();

    // Clone the request and add the authorization header if the token exists
    if (authToken) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      // Pass the cloned request instead of the original request to the next handle
      return next.handle(authReq);
    }

    // If no token, pass the original request
    return next.handle(req);
  }
} 