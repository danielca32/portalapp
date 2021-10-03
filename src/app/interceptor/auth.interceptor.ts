import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../service/authentication.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authenticationService: AuthenticationService) { }

  intercept(httpRequest: HttpRequest<any>, httpHandler: HttpHandler): Observable<HttpEvent<any>> {

    if (httpRequest.url.includes(`${this.authenticationService.host}/user/login`) ||
      httpRequest.url.includes(`${this.authenticationService.host}/user/register`)
   ) { //   httpRequest.url.includes(`${this.authenticationService.host}/user/resetpassword`)
      return httpHandler.handle(httpRequest);
    }

    this.authenticationService.loadToken();
    const token = this.authenticationService.getToken();
    const request = httpRequest.clone({setHeaders: { Authorization: `Bearer ${token}`}});
    return httpHandler.handle(request);


  }
}
