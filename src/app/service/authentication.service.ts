import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../model/user';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private host = environment.apiUrl;
  private token: string;
  private loggedInUsername: string;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) { }

  public login(user: User): Observable<HttpResponse<any> | HttpErrorResponse> {
    return this.http.post<HttpResponse<any> | HttpErrorResponse>
      (`${this.host}/user/login`, user, { observe: 'response' });
  }

  public register(user: User): Observable<HttpResponse<any> | HttpErrorResponse> {
    return this.http.post<HttpResponse<any> | HttpErrorResponse>
      (`${this.host}/user/register`, user);
  }

  public logOut(): void {
    this.token = null;
    this.loggedInUsername = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('users');
  }

  public saveToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public addUserToLocalCache(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  public getUserFromLocalCache(): User | null {
    let user: string | null = localStorage.getItem('user');
    if (user !== null) {
      return JSON.parse(user);
    } else {
      return null;
    }
  }

  public loadToken(): User {
    return JSON.parse(localStorage.getItem('token')!);
  }

  public getToken(): string {
    return this.token;
  }

  public isLoggedIn(): boolean {
    this.loadToken();
    if (this.token !== null && this.token !== '') {
      if (this.jwtHelper.decodeToken(this.token).sub != null || '') {//"sub == subject"
        if (!this.jwtHelper.isTokenExpired(this.token)) {
          this.loggedInUsername = this.jwtHelper.decodeToken(this.token).sub;
          return true;
        }
      } else {
        this.logOut();
        return false;
      }
    }

  }
}